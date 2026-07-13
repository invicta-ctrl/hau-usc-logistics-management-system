[CmdletBinding()]
param(
    [string]$Instruction,
    [string]$PromptFile,
    [string]$BriefFile,
    [switch]$RefineOnly,
    [switch]$Assess,
    [switch]$Execute,
    [switch]$Approve,
    [switch]$SkipReview,
    [switch]$AllowDirty,
    [switch]$ReviewLatest
)

$ErrorActionPreference = 'Stop'

function Fail-Route([int]$Code, [string]$Message) {
    [Console]::Error.WriteLine("codex-route: $Message")
    exit $Code
}

function Invoke-RoutingNode([string[]]$Arguments) {
    $nodeScript = Join-Path $script:RepoRoot 'scripts/codex-routing.mjs'
    $output = & node $nodeScript @Arguments 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw $output.Trim()
    }
    return $output.Trim()
}

function Write-RuntimeFile([string]$Path, [string]$Content) {
    $parent = Split-Path -Parent $Path
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    Set-Content -LiteralPath $Path -Value $Content -Encoding utf8 -NoNewline
}

function Invoke-VerificationProfile([string]$Profile) {
    switch ($Profile) {
        'documentation' {
            Invoke-RoutingNode @('docs', $script:RepoRoot) | Write-Output
        }
        'focused' {
            Invoke-RoutingNode @('docs', $script:RepoRoot) | Write-Output
            & npm test -- tests/routing
            if ($LASTEXITCODE -ne 0) { throw 'Focused project tests failed.' }
        }
        'full' {
            & npm run check
            if ($LASTEXITCODE -ne 0) { throw 'npm run check failed.' }
        }
        'release' {
            & npm run check
            if ($LASTEXITCODE -ne 0) { throw 'npm run check failed.' }
            & npm run test:e2e
            if ($LASTEXITCODE -ne 0) { throw 'npm run test:e2e failed.' }
        }
        default { throw "Unsupported verification profile: $Profile" }
    }
}

try {
    $script:RepoRoot = (& git rev-parse --show-toplevel).Trim()
    if (-not $script:RepoRoot -or -not (Test-Path -LiteralPath (Join-Path $script:RepoRoot '.codex/routing'))) {
        Fail-Route 10 'Run this launcher inside the HAU-USC Git repository.'
    }
    $runtime = Join-Path $script:RepoRoot '.codex/runtime'
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    $refinementPath = Join-Path $runtime 'current-task-refinement.json'
    $briefPath = Join-Path $runtime 'current-task-brief.md'
    $routePath = Join-Path $runtime 'current-route.json'
    $workerOutputPath = Join-Path $runtime 'worker-output.md'
    $reviewOutputPath = Join-Path $runtime 'review-output.md'
    $originalPath = Join-Path $runtime 'original-instruction.txt'

    if ($ReviewLatest) {
        if (-not (Test-Path -LiteralPath $routePath)) { Fail-Route 30 'No current route exists.' }
        Get-Content -LiteralPath $routePath -Raw
        if (Test-Path -LiteralPath $reviewOutputPath) {
            Write-Output '--- latest review ---'
            Get-Content -LiteralPath $reviewOutputPath -Raw
        }
        exit 0
    }

    $inputCount = @($Instruction, $PromptFile, $BriefFile) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count
    if ($inputCount -gt 1) { Fail-Route 10 'Use exactly one of -Instruction, -PromptFile, or -BriefFile.' }
    if ($inputCount -eq 0) { Fail-Route 10 'Provide -Instruction, -PromptFile, or -BriefFile.' }

    $branch = (& git branch --show-current).Trim()
    $dirty = (& git status --porcelain).Trim()
    if ($dirty -and (-not $AllowDirty -or $Execute)) {
        Fail-Route 30 'Working tree is dirty. Resolve or explicitly review the change before routing; execution never runs with a dirty tree.'
    }
    if ($Execute -and $branch -in @('main', 'master')) {
        Fail-Route 30 "Execution is blocked on protected branch '$branch'."
    }

    if ($BriefFile) {
        if (-not (Test-Path -LiteralPath $BriefFile)) { Fail-Route 10 "Brief file not found: $BriefFile" }
        Copy-Item -LiteralPath $BriefFile -Destination $refinementPath -Force
        $briefJson = Get-Content -LiteralPath $refinementPath -Raw | ConvertFrom-Json
        if (-not $briefJson.original_input) { Fail-Route 10 'Brief file must contain original_input.' }
        Write-RuntimeFile $originalPath ([string]$briefJson.original_input)
    } else {
        $original = if ($PromptFile) { Get-Content -LiteralPath $PromptFile -Raw } else { $Instruction }
        if (-not $original.Trim()) { Fail-Route 10 'The instruction or prompt file is empty.' }
        Write-RuntimeFile $originalPath $original
        $inputKind = (Invoke-RoutingNode @('classify', '--input-file', $originalPath)).Trim()
        Write-Output "Input classification: $inputKind"
        if ($inputKind -in @('complete_prompt', 'precise_command')) {
            Invoke-RoutingNode @('direct-refinement', '--input-file', $originalPath, '--input-kind', $inputKind, '--output', $refinementPath) | Write-Output
        } else {
            $codexCommand = $null
            if ($env:CODEX_CLI_PATH -and (Test-Path -LiteralPath $env:CODEX_CLI_PATH)) {
                $codexCommand = $env:CODEX_CLI_PATH
            } else {
                $codexCommand = (Get-Command codex -ErrorAction SilentlyContinue).Source
            }
            if (-not $codexCommand) {
                Fail-Route 20 'Codex CLI was not found. Install or expose codex exec before refining a rough or partial instruction.'
            }
            $schemaPath = Join-Path $script:RepoRoot '.codex/routing/task-refinement.schema.json'
            $refinerPrompt = @"
You are the read-only instruction refiner for this repository.

Read the original user instruction verbatim from .codex/runtime/original-instruction.txt.
Read only the authoritative files needed to understand it, beginning with AGENTS.md,
PROJECT_STATUS.md, docs/WORK_CONTINUATION.md, and task-relevant project documents.
Classify the input exactly as rough_instruction, partial_task, complete_prompt, or
precise_command. Produce only JSON conforming to .codex/routing/task-refinement.schema.json.
Preserve original_input exactly. Separate verified facts from assumptions. Keep the
brief proportional. Do not invent features, scope, dependencies, commands, or
acceptance criteria. Mark safe_to_route false for unresolved material ambiguity,
authority conflict, missing context, or low confidence. Set requires_user_approval
for destructive/external-write work; the launcher stops unless -Approve is supplied.
Do not edit files or run destructive commands.
"@
            $codexArgs = @('exec', '--ephemeral', '--sandbox', 'read-only', '--model', 'gpt-5.6-terra', '--config', 'model_reasoning_effort="medium"', '--output-schema', $schemaPath, '-o', $refinementPath, $refinerPrompt)
            try {
                & $codexCommand @codexArgs
            } catch {
                Fail-Route 20 "Codex refiner could not start: $($_.Exception.Message)"
            }
            if ($LASTEXITCODE -ne 0) { Fail-Route 20 "Codex refiner exited with code $LASTEXITCODE." }
        }
    }

    Invoke-RoutingNode @('validate-refinement', $refinementPath) | Write-Output
    Invoke-RoutingNode @('render-brief', $refinementPath, '--output', $briefPath) | Write-Output
    if ($RefineOnly) {
        Write-Output "Refined brief: $briefPath"
        exit 0
    }

    $routeArgs = @('route', $refinementPath, '--output', $routePath)
    if ($Approve) { $routeArgs += '--approved' }
    Invoke-RoutingNode $routeArgs | Write-Output
    Invoke-RoutingNode @('validate-route', $routePath) | Write-Output
    $route = Get-Content -LiteralPath $routePath -Raw | ConvertFrom-Json
    Write-Output ("Route: {0} / {1} / {2}; profile={3}; safe={4}" -f $route.route_class, $route.model, $route.reasoning_effort, $route.verification_profile, $route.safe_to_execute)
    Write-Output ("Usage: {0}" -f $route.usage_justification)
    Write-Output ("Cheaper route: {0}" -f $route.why_not_cheaper)
    Write-Output ("More expensive route: {0}" -f $route.why_not_more_expensive)
    if ($route.stop_reasons.Count -gt 0) {
        Write-Output 'Stop reasons:'
        $route.stop_reasons | ForEach-Object { Write-Output "- $_" }
    }
    if (-not $route.safe_to_execute) { Fail-Route 30 'Route is not executable. Review the refinement and resolve the listed stop reasons.' }
    if (-not $Execute) {
        Write-Output 'Assessment complete; no worker was started. Use -Execute only after inspecting the brief and route.'
        exit 0
    }

    $codexCommand = if ($env:CODEX_CLI_PATH -and (Test-Path -LiteralPath $env:CODEX_CLI_PATH)) { $env:CODEX_CLI_PATH } else { (Get-Command codex -ErrorAction SilentlyContinue).Source }
    if (-not $codexCommand) { Fail-Route 20 'Codex CLI was not found for worker execution.' }
    $workerPrompt = @"
You are the routed HAU-USC worker. The validated execution brief is at
.codex/runtime/current-task-brief.md and the route decision is at
.codex/runtime/current-route.json. Implement only that brief. Read AGENTS.md and
relevant authoritative project documents first. Do not read the raw instruction
to broaden scope. Do not perform Apps Script, Google Sheets, Google Drive,
deployment, migration, publication, merge, or other external writes. Do not
invent shell commands; leave deterministic verification to the launcher. Return
a concise implementation summary and remaining risks.
"@
    $workerArgs = @('exec', '--ephemeral', '--sandbox', 'workspace-write', '--model', [string]$route.model, '--config', ('model_reasoning_effort="{0}"' -f $route.reasoning_effort), '-o', $workerOutputPath, $workerPrompt)
    try {
        & $codexCommand @workerArgs
    } catch {
        Fail-Route 20 "Codex worker could not start: $($_.Exception.Message)"
    }
    if ($LASTEXITCODE -ne 0) { Fail-Route 40 "Codex worker exited with code $LASTEXITCODE." }
    Write-Output "Worker output: $workerOutputPath"

    try {
        Invoke-VerificationProfile ([string]$route.verification_profile)
    } catch {
        Fail-Route 40 $_.Exception.Message
    }
    Write-Output 'Deterministic verification passed.'

    if (-not $SkipReview) {
        $reviewPrompt = @"
Perform a read-only independent review of the current HAU-USC working tree.
Read .codex/runtime/current-task-brief.md, .codex/runtime/current-route.json,
and .codex/runtime/worker-output.md. Inspect the Git diff and relevant tests.
Report only concrete correctness, security, authority-boundary, regression,
runtime-state, routing, documentation, and test-completeness findings. Do not
edit files or run external writes. If no blocking finding exists, say so and
name the evidence checked.
"@
        $reviewArgs = @('exec', '--ephemeral', '--sandbox', 'read-only', '--model', 'gpt-5.6-sol', '--config', 'model_reasoning_effort="high"', '-o', $reviewOutputPath, $reviewPrompt)
        try {
            & $codexCommand @reviewArgs
        } catch {
            Fail-Route 50 "Codex reviewer could not start: $($_.Exception.Message)"
        }
        if ($LASTEXITCODE -ne 0) { Fail-Route 50 "Codex reviewer exited with code $LASTEXITCODE." }
        Write-Output "Review output: $reviewOutputPath"
    } else {
        Write-Output 'Independent review skipped explicitly with -SkipReview.'
    }
    Write-Output 'Routed task completed locally. No external systems were touched by the launcher.'
} catch {
    Fail-Route 20 $_.Exception.Message
}

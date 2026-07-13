# Instruction refinement policy

## Classification

The launcher classifies each input as exactly one of:

- `rough_instruction`: broad or ambiguous outcome, target, behavior, or
  completion condition.
- `partial_task`: understandable goal with missing implementation or
  verification detail.
- `complete_prompt`: sufficient objective, context, scope, constraints,
  acceptance, verification, and documentation expectations.
- `precise_command`: small, reversible, named action with an obvious finish
  condition.

The deterministic classifier is a first gate. A read-only Codex refiner adds
repository-grounded detail for rough and partial inputs.

## Required refiner behavior

The refiner must preserve the original text verbatim, inspect only relevant
authoritative files, distinguish facts from assumptions, name non-goals, and
produce a schema-valid brief. It must not invent features, redesign unrelated
areas, add dependencies, or copy whole documents into the prompt.

## Automatic continuation

Routing may continue when refinement confidence is at least `0.85`, the brief
is safe, no material questions remain, no destructive/external-write action is
requested, and the repository is clean and on the expected project branch.

The launcher stops before routing or execution for unresolved material
ambiguity, authority conflict, missing context, scope expansion, destructive
operations, migration/deployment/publication, dirty working tree, unsupported
Codex capability, or a confidence below the threshold.

## Runtime privacy

Runtime artifacts are local and gitignored. The Context Vault may contain this
standard and templates, never a live prompt, current assumptions, route output,
logs, diffs, secrets, or build artifacts.


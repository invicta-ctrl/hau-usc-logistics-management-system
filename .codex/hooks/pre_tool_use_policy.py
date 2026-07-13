"""Best-effort project hook for supported edit tools.

Hooks are contextual guardrails, not the sole enforcement boundary. The
launcher remains authoritative for refinement, routing, and verification.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path


WRITE_TOKENS = re.compile(
    r"\b(?:apply_patch|git\s+(?:commit|merge|push|reset|clean)|" \
    r"(?:remove|del|erase|move|rename|copy|write|set-content|out-file)|" \
    r"(?:npm\s+install|clasp\s+(?:push|deploy))\b)",
    re.IGNORECASE,
)


def deny(reason: str) -> int:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}))
    return 0


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        return 0
    root = Path(os.environ.get("CODEX_PROJECT_ROOT", Path.cwd()))
    route_path = root / ".codex" / "runtime" / "current-route.json"
    route = {}
    if route_path.is_file():
        try:
            route = json.loads(route_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            route = {}
    safe = route.get("safe_to_execute") is True
    tool_name = event.get("tool_name")
    tool_input = event.get("tool_input") or {}
    if tool_name in {"apply_patch", "Edit", "Write"} and not safe:
        return deny("No validated executable route is present; run scripts/codex-route.ps1 first.")
    if tool_name == "Bash":
        command = str(tool_input.get("command", ""))
        if WRITE_TOKENS.search(command) and not safe:
            return deny("Potential write command blocked until the validated route permits execution.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

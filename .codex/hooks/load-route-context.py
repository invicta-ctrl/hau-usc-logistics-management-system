"""Add the validated route to Codex prompt context without mutating the repo."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def main() -> int:
    root = Path(os.environ.get("CODEX_PROJECT_ROOT", Path.cwd()))
    route_path = root / ".codex" / "runtime" / "current-route.json"
    if not route_path.is_file():
        return 0
    try:
        route = json.loads(route_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0
    if not isinstance(route, dict):
        return 0
    if route.get("safe_to_execute") is not True:
        return 0
    print(
        "Validated HAU-USC route context: "
        f"{route.get('route_class', 'unknown')} / "
        f"{route.get('model', 'unknown')} / "
        f"{route.get('reasoning_effort', 'unknown')}; "
        "follow the refined brief and the project authority order."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env bash
# Ask before commit / push / PR create unless ship approvals are recorded.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export SWE_HOOK_INPUT
SWE_HOOK_INPUT="$(cat)"
python3 - "$ROOT" <<'PY'
import json, os, re, sys
from pathlib import Path

root = Path(sys.argv[1])
sys.path.insert(0, str(root / ".cursor" / "hooks"))
from workflow_common import chat_workflow_dir  # noqa: E402

data = json.loads(os.environ.get("SWE_HOOK_INPUT") or "{}")
command = data.get("command") or ""

risky = bool(re.search(
    r"(git\s+commit|git\s+push|gh\s+pr\s+create|gh\s+pr\s+merge)",
    command,
))
if not risky:
    print(json.dumps({"permission": "allow"}))
    raise SystemExit(0)

env_abs = os.environ.get("SWE_WORKFLOW_ABS") or os.environ.get("WYISE_WORKFLOW_ABS")
env_rel = os.environ.get("SWE_WORKFLOW_DIR") or os.environ.get("WYISE_WORKFLOW_DIR")
if env_abs:
    chat_dir = Path(env_abs)
elif env_rel:
    chat_dir = root / env_rel
else:
    chat_dir = chat_workflow_dir(root, data)

ship = chat_dir / "ship.md"
state = chat_dir / "state.md"
approved = False
if ship.is_file():
    text = ship.read_text(encoding="utf-8")
    if re.search(r"(Commit|Push|PR)\s+approved:\s*yes", text, re.I):
        approved = True
if state.is_file() and re.search(
    r"ship_approved:\s*true", state.read_text(encoding="utf-8"), re.I
):
    approved = True

if approved:
    print(json.dumps({"permission": "allow"}))
else:
    print(json.dumps({
        "permission": "ask",
        "user_message": (
            "Ship gate: this command commits, pushes, or opens/merges a PR. "
            "/swe requires explicit human approval before running it."
        ),
        "agent_message": (
            f"Confirm with the human, or record approvals in {chat_dir}/ship.md / "
            "ship_approved: true in that chat's state.md, before commit/push/PR."
        ),
    }))
PY
exit 0

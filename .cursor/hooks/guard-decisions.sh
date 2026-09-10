#!/usr/bin/env bash
# Ask before deleting durable workflow decision/state artifacts.
set -euo pipefail
export SWE_HOOK_INPUT
SWE_HOOK_INPUT="$(cat)"
python3 <<'PY'
import json, os, re

data = json.loads(os.environ.get("SWE_HOOK_INPUT") or "{}")
tool = str(data.get("tool_name") or data.get("tool") or "")
args = data.get("tool_input") or data.get("arguments") or data.get("input") or {}
path = str(
    args.get("path")
    or args.get("file_path")
    or args.get("target_notebook")
    or ""
)

ask = False
user_msg = ""
agent_msg = ""

decisions = bool(re.search(r"\.workflow/(chats/[^/]+/)?decisions\.md$", path))
state = bool(re.search(r"\.workflow/(chats/[^/]+/)?state\.md$", path))

if decisions and "Delete" in tool:
    ask = True
    user_msg = (
        "Delete of workflow decisions.md needs confirmation "
        "(may contain LOCKED decisions)."
    )
    agent_msg = "Ask the human before deleting decisions.md."
elif state and "Delete" in tool:
    ask = True
    user_msg = "Delete of workflow state.md needs confirmation."
    agent_msg = "Ask before deleting workflow state."

if ask:
    print(json.dumps({
        "permission": "ask",
        "user_message": user_msg,
        "agent_message": agent_msg,
    }))
else:
    print(json.dumps({"permission": "allow"}))
PY
exit 0

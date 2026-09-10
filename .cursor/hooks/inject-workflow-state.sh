#!/usr/bin/env bash
# Create chat-scoped workflow dir and inject path + state into the session.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export SWE_HOOK_INPUT
SWE_HOOK_INPUT="$(cat)"
python3 - "$ROOT" <<'PY'
import json, os, sys
from pathlib import Path

root = Path(sys.argv[1])
sys.path.insert(0, str(root / ".cursor" / "hooks"))
from workflow_common import chat_workflow_dir, relative_chat_dir  # noqa: E402

payload = json.loads(os.environ.get("SWE_HOOK_INPUT") or "{}")
chat_dir = chat_workflow_dir(root, payload)
rel = relative_chat_dir(root, chat_dir)
state = chat_dir / "state.md"

snippet = "\n".join(state.read_text(encoding="utf-8").splitlines()[:40])
ctx = (
    "Chat-scoped /swe workflow (this chat only):\n"
    f"- SWE_WORKFLOW_DIR={rel}\n"
    f"- Persist ALL /swe artifacts only under {rel}/\n"
    f"- Templates: .workflow/templates/\n"
    f"- Do NOT write runtime artifacts to .workflow/ root or other chats/\n"
    f"- Human leads SHAPE; agent implements after approval\n"
    f"- Active state ({rel}/state.md):\n"
    + snippet
    + "\nResume via /swe in this chat; do not skip WAITING_FOR_HUMAN gates."
)

print(json.dumps({
    "env": {
        "SWE_WORKFLOW_DIR": rel,
        "SWE_WORKFLOW_ABS": str(chat_dir),
        # Back-compat for older skill text / open chats
        "WYISE_WORKFLOW_DIR": rel,
        "WYISE_WORKFLOW_ABS": str(chat_dir),
    },
    "additional_context": ctx,
}))
PY
exit 0

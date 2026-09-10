"""Shared helpers for chat-scoped /swe workflow dirs."""

from __future__ import annotations

import re
from pathlib import Path

_SAFE_ID = re.compile(r"[^a-zA-Z0-9._-]+")


def session_id_from_payload(payload: dict) -> str:
    raw = (
        payload.get("session_id")
        or payload.get("conversation_id")
        or ""
    )
    sid = _SAFE_ID.sub("_", str(raw).strip())[:128]
    return sid or "unknown-session"


def chat_workflow_dir(root: Path, payload: dict) -> Path:
    """Return `.workflow/chats/<session_id>/`, creating it and seeding state if needed."""
    sid = session_id_from_payload(payload)
    chat_dir = root / ".workflow" / "chats" / sid
    chat_dir.mkdir(parents=True, exist_ok=True)
    state = chat_dir / "state.md"
    if not state.is_file():
        template = root / ".workflow" / "templates" / "state.md"
        if template.is_file():
            state.write_text(template.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            state.write_text(_DEFAULT_STATE, encoding="utf-8")
    return chat_dir


def relative_chat_dir(root: Path, chat_dir: Path) -> str:
    try:
        return str(chat_dir.relative_to(root))
    except ValueError:
        return str(chat_dir)


_DEFAULT_STATE = """# Workflow State

```yaml
current_stage: INTAKE
status: NOT_STARTED
brief: null
repos_in_scope: []
last_completed_stage: null
next_action: Start with /swe
blocking_question: null
required_human_decision: null
ship_approved: false
human_review_decision: null
plan_approved: false
prod_check: skip
updated_at: null
```

## Stage machine

```
INTAKE → SHAPE → APPROVE → IMPLEMENT → VERIFY
  → [PROD_CHECK] → HUMAN_REVIEW → SHIP → COMPLETED
```

PROD_CHECK is optional (default: skip).

## Status values

`NOT_STARTED` · `IN_PROGRESS` · `WAITING_FOR_HUMAN` · `APPROVED` · `BLOCKED` · `PASSED` · `FAILED` · `COMPLETED`

## Resume rule

On `/swe`, read this file first. Do not restart completed stages.
If `status` is `WAITING_FOR_HUMAN`, present the pending decision and stop.
"""

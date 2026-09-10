#!/usr/bin/env python3
"""Append prompt/response pairs to .agent-logs/ for the 8x assignment capture format.

Fires from Cursor hooks:
  - beforeSubmitPrompt  -> PROMPT entry
  - afterAgentResponse  -> RESPONSE entry (final assistant text only)
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

SAFE_ID = re.compile(r"[^a-zA-Z0-9._-]+")
FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_ts(dt: datetime | None = None) -> str:
    d = dt or utc_now()
    # Millisecond precision like the assignment sample
    return d.strftime("%Y-%m-%dT%H:%M:%S.") + f"{d.microsecond // 1000:03d}Z"


def file_ts(dt: datetime | None = None) -> str:
    d = dt or utc_now()
    return d.strftime("%Y-%m-%d_%H-%M-%S")


def short_session(session_id: str) -> str:
    return session_id.split("-")[0] if session_id else "unknown"


def resolve_author() -> str:
    for key in ("AGENT_LOG_AUTHOR", "GITHUB_USER", "GH_USER"):
        val = os.environ.get(key, "").strip()
        if val:
            return val
    cfg = Path(__file__).resolve().parent / "capture-author.txt"
    if cfg.is_file():
        val = cfg.read_text(encoding="utf-8").strip()
        if val:
            return val
    return "unknown"


def resolve_model(payload: dict) -> str:
    for key in ("model_id", "model"):
        val = payload.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return "unknown"


def session_id_from_payload(payload: dict) -> str:
    raw = payload.get("conversation_id") or payload.get("session_id") or ""
    sid = SAFE_ID.sub("_", str(raw).strip())[:128]
    return sid or "unknown-session"


def find_log_file(logs_dir: Path, session_id: str) -> Path | None:
    matches = sorted(logs_dir.glob(f"*_{session_id}.md"))
    return matches[-1] if matches else None


def parse_frontmatter(text: str) -> dict[str, str]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        meta[k.strip()] = v.strip()
    return meta


def render_frontmatter(meta: dict[str, str]) -> str:
    order = [
        "session_id",
        "date",
        "author",
        "model",
        "tool",
        "project",
        "total_exchanges",
        "first_prompt_time",
        "last_prompt_time",
    ]
    lines = ["---"]
    for key in order:
        if key in meta:
            lines.append(f"{key}: {meta[key]}")
    for key, val in meta.items():
        if key not in order:
            lines.append(f"{key}: {val}")
    lines.append("---")
    return "\n".join(lines) + "\n"


def update_frontmatter(text: str, updates: dict[str, str]) -> str:
    meta = parse_frontmatter(text)
    meta.update(updates)
    body = FRONTMATTER_RE.sub("", text, count=1) if FRONTMATTER_RE.match(text) else text
    return render_frontmatter(meta) + body.lstrip("\n")


def count_prompts(text: str) -> int:
    return len(re.findall(r"\[LOG_ENTRY type=PROMPT ", text))


def create_session_log(
    logs_dir: Path,
    session_id: str,
    *,
    author: str,
    model: str,
    project: str,
    now: datetime,
) -> Path:
    logs_dir.mkdir(parents=True, exist_ok=True)
    path = logs_dir / f"{file_ts(now)}_{session_id}.md"
    date = now.strftime("%Y-%m-%d")
    short = short_session(session_id)
    meta = {
        "session_id": session_id,
        "date": date,
        "author": author,
        "model": model,
        "tool": "cursor",
        "project": project,
        "total_exchanges": "0",
        "first_prompt_time": "",
        "last_prompt_time": "",
    }
    header = (
        render_frontmatter(meta)
        + f"\n# Session Log - {date}\n\n"
        + f"Session: `{short}` | Project: `{project}` | Author: `{author}`\n\n"
        + "---\n"
    )
    path.write_text(header, encoding="utf-8")
    return path


def append_entry(path: Path, entry: str) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write("\n" + entry.rstrip() + "\n")


def handle_prompt(payload: dict, root: Path) -> dict:
    now = utc_now()
    ts = iso_ts(now)
    session_id = session_id_from_payload(payload)
    model = resolve_model(payload)
    author = resolve_author()
    project = root.name
    logs_dir = root / ".agent-logs"

    path = find_log_file(logs_dir, session_id)
    if path is None:
        path = create_session_log(
            logs_dir, session_id, author=author, model=model, project=project, now=now
        )

    text = path.read_text(encoding="utf-8")
    num = count_prompts(text) + 1
    short = short_session(session_id)
    prompt = payload.get("prompt")
    if prompt is None:
        prompt = ""
    elif not isinstance(prompt, str):
        prompt = json.dumps(prompt, ensure_ascii=False)

    entry = (
        f"[LOG_ENTRY type=PROMPT num={num} session={short}]\n"
        f"timestamp: {ts}\n"
        f"model: {model}\n\n"
        f"{prompt}\n"
    )
    append_entry(path, entry)

    meta = parse_frontmatter(path.read_text(encoding="utf-8"))
    updates = {
        "total_exchanges": str(num),
        "last_prompt_time": ts,
        "model": model,
        "author": author,
    }
    if not meta.get("first_prompt_time"):
        updates["first_prompt_time"] = ts
    path.write_text(update_frontmatter(path.read_text(encoding="utf-8"), updates), encoding="utf-8")
    return {"continue": True}


def handle_response(payload: dict, root: Path) -> dict:
    now = utc_now()
    ts = iso_ts(now)
    session_id = session_id_from_payload(payload)
    model = resolve_model(payload)
    logs_dir = root / ".agent-logs"
    short = short_session(session_id)

    path = find_log_file(logs_dir, session_id)
    if path is None:
        # Response without a prior captured prompt in this session — create shell log
        path = create_session_log(
            logs_dir,
            session_id,
            author=resolve_author(),
            model=model,
            project=root.name,
            now=now,
        )

    text = path.read_text(encoding="utf-8")
    num = count_prompts(text) or 1

    response_text = payload.get("text")
    if response_text is None:
        response_text = ""
    elif not isinstance(response_text, str):
        response_text = json.dumps(response_text, ensure_ascii=False)

    entry = (
        f"[LOG_ENTRY type=RESPONSE num={num} session={short}]\n"
        f"timestamp: {ts}\n"
        f"model: {model}\n\n"
        f"{response_text}\n"
    )
    append_entry(path, entry)

    path.write_text(
        update_frontmatter(path.read_text(encoding="utf-8"), {"model": model}),
        encoding="utf-8",
    )
    return {}


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        # Fail open — never block the agent on logging failures
        print("{}")
        return 0

    event = str(payload.get("hook_event_name") or "")
    try:
        if event == "beforeSubmitPrompt":
            out = handle_prompt(payload, root)
        elif event == "afterAgentResponse":
            out = handle_response(payload, root)
        else:
            out = {}
    except Exception:
        # Fail open
        out = {"continue": True} if event == "beforeSubmitPrompt" else {}

    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

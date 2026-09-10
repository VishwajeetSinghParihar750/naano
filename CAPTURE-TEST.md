# CAPTURE-TEST

## Tool and model (step 1)

- **Tool:** Cursor (IDE Agent)
- **Model:** Composer / Auto (agent router). Same model plans and executes in these chats. Hook payloads currently record `model: default` from Cursor’s `model` field.
- **Auto mechanism:** Yes — Cursor project hooks

## Mechanism and config changed

- **Mechanism:** Cursor lifecycle hooks that run a command automatically on every user prompt and every final agent response (no manual logging).
- **Config file:** `.cursor/hooks.json`
  - `beforeSubmitPrompt` → `.cursor/hooks/capture-agent-log.sh`
  - `afterAgentResponse` → `.cursor/hooks/capture-agent-log.sh`
- **Implementation:** `.cursor/hooks/capture-agent-log.py` appends `[LOG_ENTRY type=PROMPT|RESPONSE]` pairs to `.agent-logs/`
- **Author label:** `.cursor/hooks/capture-author.txt` (`svishwajeet750`)

## Log files the canaries landed in

1. Session 1: `.agent-logs/2026-09-10_04-28-03_cf541f2c-5256-44a1-b15e-60a2706b01c0.md`
2. Session 2: `.agent-logs/2026-09-10_04-29-35_6e1f01f0-117a-4c1e-9902-d9ec525fa93d.md`

## Canary entries (raw)

### Canary 1 — session `cf541f2c`

```
[LOG_ENTRY type=PROMPT num=1 session=cf541f2c]
timestamp: 2026-09-10T04:29:09.311Z
model: default

CAPTURE TEST — 8x assignment, Sahil

[LOG_ENTRY type=RESPONSE num=1 session=cf541f2c]
timestamp: 2026-09-10T04:29:26.453Z
model: default

**Canary received.** Prompt is already in the log:

`.agent-logs/2026-09-10_04-28-03_cf541f2c-5256-44a1-b15e-60a2706b01c0.md`

```
CAPTURE TEST — 8x assignment, Sahil
```

This reply should append as the matching RESPONSE when the turn ends.

**Next:** open a **new** Agent chat in this repo and send:

`CAPTURE TEST — 8x assignment, Sahil — session 2`

Then come back here (or tell me in that chat) once that second log file appears under `.agent-logs/`. I’ll write `CAPTURE-TEST.md` after both canaries are confirmed.
```

### Canary 2 — session `6e1f01f0`

```
[LOG_ENTRY type=PROMPT num=1 session=6e1f01f0]
timestamp: 2026-09-10T04:29:35.245Z
model: default

CAPTURE TEST — 8x assignment, Sahil — session 2

[LOG_ENTRY type=RESPONSE num=1 session=6e1f01f0]
timestamp: 2026-09-10T04:30:00.139Z
model: default

**Session 2 canary received.** Both capture logs are present:

| Canary | Session | Log |
|---|---|---|
| `CAPTURE TEST — 8x assignment, Sahil` | `cf541f2c` | `.agent-logs/2026-09-10_04-28-03_cf541f2c-5256-44a1-b15e-60a2706b01c0.md` |
| `CAPTURE TEST — 8x assignment, Sahil — session 2` | `6e1f01f0` | `.agent-logs/2026-09-10_04-29-35_6e1f01f0-117a-4c1e-9902-d9ec525fa93d.md` |

Prompt for this turn is already in the second file. This reply should append as the matching RESPONSE when the turn ends.

Hooks capture is working across chats. Next step from the prior session: write `CAPTURE-TEST.md`, then product build can start.
```

## What we tried / notes

1. **Confirmed Cursor has real hooks** via Cursor docs + create-hook skill (`beforeSubmitPrompt`, `afterAgentResponse`) — not rules-only, not manual logging.
2. **Also checked** on-disk agent transcripts under `~/.cursor/projects/.../agent-transcripts/` — they include tool calls / intermediate steps, so they are not the submission format; hooks are used instead.
3. **Local dry-run** of the capture script with synthetic stdin JSON to validate the markdown format before live canaries (those dry-run files were removed; not part of the submission logs).
4. **First setup turn** in session `cf541f2c` had no PROMPT entry because `beforeSubmitPrompt` was not installed yet when that message was sent; `afterAgentResponse` still wrote the orphan setup RESPONSE — left in the log intentionally.
5. Did **not** add `.agent-logs/` to `.gitignore`.
6. Did **not** fall back to wrapping the session manually — automatic hooks work across two separate chats.

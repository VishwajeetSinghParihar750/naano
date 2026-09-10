# /swe — Cursor workflow

Human-gated collaborative SWE for this assignment repo. Modular skills +
read-only reviewer agents + durable **chat-scoped** `.workflow/` state.

**You lead shaping. The agent implements after you approve.**

## Architecture

```
/swe (command + skill)
        │
        ├─ skills/          stage procedures
        ├─ agents/          independent read-only reviewers
        ├─ rules/           always-on gates & workspace facts
        ├─ hooks/           sessionStart creates chat dir; ship / artifact guards
        └─ .workflow/
             templates/     shared
             chats/<id>/    this chat only
```

`/solve-issue` is a compatibility alias for `/swe`.

## Stages

```
INTAKE → SHAPE → APPROVE → IMPLEMENT → VERIFY
  → [PROD_CHECK] → HUMAN_REVIEW → SHIP
```

| Stage | Skill / agents | Human gate |
|---|---|---|
| INTAKE | orchestrator | — |
| SHAPE | `shape` | approve plan / go implement |
| IMPLEMENT | `implementation` | stop if plan invalid |
| VERIFY | `diff-minimizer`, `code-reviewer`, `bug-hunter`, `test-reviewer` | blocking findings |
| PROD_CHECK | `production-readiness` + `production-reviewer` | optional; blockers |
| HUMAN_REVIEW | `human-review` | APPROVE / REQUEST_CHANGES |
| SHIP | `pr-creation` | commit / push / PR each confirmed |

PROD_CHECK defaults to **skip** (assignment / small diffs). Opt in for auth,
data, public API, or ops risk.

## Directory structure

```
.cursor/
  commands/swe.md
  commands/solve-issue.md   # alias
  skills/swe, shape, implementation, …
  agents/ …
  rules/ …
  hooks.json
  hooks/
    inject-workflow-state.sh   # sessionStart → SWE_WORKFLOW_DIR
    guard-ship.sh
    guard-decisions.sh
    capture-agent-log.sh       # .agent-logs/ prompt+response
    workflow_common.py
.workflow/
  templates/
  chats/<session_id>/
```

## Start / resume

```
/swe
/swe Rebuild the product from /recon screenshots
/swe Fix the brief builder so brands cannot see outcomes before budget
```

Each **new Cursor chat** gets `.workflow/chats/<session_id>/` via `sessionStart`
and `SWE_WORKFLOW_DIR` in context. Every run reads that chat's `state.md`
first. A brand-new chat does **not** inherit another chat's workflow.

## Human approval

Locked rows in this chat's `decisions.md` are never silently overridden.
Commit, push, and PR creation always require an explicit yes in the current turn.

## Reviewers

Reviewer agents are **read-only**. The main agent aggregates findings into
`$SWE_WORKFLOW_DIR/review.md` / `production-readiness.md` and applies fixes
only when you (or a gate) require them.

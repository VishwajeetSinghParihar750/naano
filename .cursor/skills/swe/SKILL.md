---
name: swe
description: >-
  Orchestrates the human-gated /swe workflow: intake, collaborative shape,
  implement, verify, optional prod check, human review, and ship. Use when the
  user runs /swe or /solve-issue, resumes in-progress work, or asks to continue
  the SWE pipeline.
disable-model-invocation: true
---

# /swe — orchestrator

Collaborative SWE for **this chat only**. Human leads shaping; agent implements
after approval. Persist under `$SWE_WORKFLOW_DIR`
(`.workflow/chats/<session_id>/`). Fall back to `$WYISE_WORKFLOW_DIR` if set.
Never write runtime artifacts to `.workflow/` root or another chat's folder.
Templates: `.workflow/templates/`.

Never skip human gates. Never commit, push, or open a PR without explicit
approval in the current turn.

## Resolve workflow dir (every invocation)

1. Use `SWE_WORKFLOW_DIR` or `WYISE_WORKFLOW_DIR` from session context / env.
2. If missing, stop and tell the user to send another message or open a **new**
   chat so `sessionStart` can create `.workflow/chats/<session_id>/`.
3. All paths below mean `$SWE_WORKFLOW_DIR/<file>` unless noted as templates.

## First actions (every invocation)

1. Read `$SWE_WORKFLOW_DIR/state.md`.
2. If `status` is `WAITING_FOR_HUMAN`, show the blocking question / required
   decision, apply the user's reply if present, update artifacts, then continue
   only when the gate is cleared.
3. If starting **new** work while another run is `IN_PROGRESS` /
   `WAITING_FOR_HUMAN` **in this chat**, ask whether to abort or resume.
4. Load only the stage skill needed next.

## Input (INTAKE)

Accept any of:

- Short goal / bug / feature description
- Pasted brief or spec
- Optional ticket id (enrichment only — not required)

Write `$SWE_WORKFLOW_DIR/brief.md` (from `.workflow/templates/brief.md` if present).
Update state:

- `current_stage: SHAPE`
- `status: IN_PROGRESS`

Then immediately run the `shape` skill.

## Stage → skill / agents

| Stage | Invoke | Gate |
|---|---|---|
| SHAPE | skill `shape` | Wait for shape / plan approval |
| IMPLEMENT | skill `implementation` | Stop if plan invalid |
| VERIFY | agents below → `review.md` | Stop on blocking findings |
| PROD_CHECK | skill `production-readiness` + `production-reviewer` | Optional; stop if `NOT_READY` |
| HUMAN_REVIEW | skill `human-review` | Wait for APPROVE / REQUEST_CHANGES |
| SHIP | skill `pr-creation` | Wait before commit / push / PR |

### When to run PROD_CHECK

Skip by default. Run when the human asks, or when the change hits auth, data
migrations, public API contracts, multi-service behavior, or production ops risk.
If skipped, go VERIFY → HUMAN_REVIEW.

### VERIFY agents (read-only, in order)

1. `diff-minimizer`
2. `code-reviewer`
3. `bug-hunter`
4. `test-reviewer`

Aggregate into `$SWE_WORKFLOW_DIR/review.md`. Reviewers must not edit application
code.

## Human gates (hard stop)

Stop and set `status: WAITING_FOR_HUMAN` after:

- SHAPE → approve plan / go implement
- IMPLEMENT → plan insufficient
- VERIFY → blocking findings (after reporting)
- PROD_CHECK → blockers (when that stage ran)
- HUMAN_REVIEW → APPROVE / REQUEST_CHANGES
- SHIP → before `git commit`, `git push`, or PR create

Do not continue past a gate in the same turn unless the user already answered it.

## Resume

Map `current_stage` + `status` to the next action. Never re-run a stage marked
completed / APPROVED / PASSED unless the user requests a redo or
`REQUEST_CHANGES` forces a loop back to IMPLEMENT → VERIFY → …

Resume only works **inside the same chat**. A new chat starts fresh.

## Ship flag

Set `ship_approved: true` in `state.md` only after the human explicitly approves
shipping in HUMAN_REVIEW **and** separately confirms commit/push/PR actions.

---
name: implementation
description: >-
  Implements the approved /swe plan with the smallest correct diff. Stops and
  returns to the human if the plan proves invalid. Never commits or opens a PR.
  Use during IMPLEMENT after shape approval.
---

# Implementation

Paths under `$SWE_WORKFLOW_DIR` (fall back `$WYISE_WORKFLOW_DIR`).

## Preconditions

Read:

- `$SWE_WORKFLOW_DIR/brief.md`
- `$SWE_WORKFLOW_DIR/decisions.md` (if present)
- `$SWE_WORKFLOW_DIR/plan.md`
- `$SWE_WORKFLOW_DIR/state.md`

Abort if `plan_approved` is not true / shape was not explicitly approved.

## Rules

1. Follow the approved plan and LOCKED decisions. Do not silently redesign.
2. Do not expand scope or refactor unrelated code.
3. Smallest correct change.
4. Match repository conventions already in this repo.
5. Add/update tests where the plan or risk requires it.
6. Preserve backwards compatibility unless the plan says otherwise.
7. **Do not** commit, push, or create a PR.
8. Run appropriate local checks for what you touched.

## If the plan is wrong

**STOP.** Do not improvise around an architectural decision.

Write `$SWE_WORKFLOW_DIR/implementation.md` with:

- what was discovered
- why the approved plan is insufficient
- what decision is now required

Set `status: WAITING_FOR_HUMAN`, `current_stage: SHAPE` or `APPROVE`, and stop.

## On success

Write `$SWE_WORKFLOW_DIR/implementation.md`:

```markdown
# Implementation

## Summary

## Files changed

## Checks run

## Deviations from plan

None. | <list with justification — only if already human-approved>

## Notes for reviewers
```

Update state:

- `current_stage: VERIFY`
- `status: IN_PROGRESS`
- `next_action: Run independent verification agents`

Then return control to the orchestrator for VERIFY (do not self-ship).

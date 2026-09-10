---
name: production-readiness
description: >-
  Optional broader-than-code-review production check for /swe. Writes
  production-readiness.md with BLOCKER/WARNING/INFORMATIONAL severity. Use at
  PROD_CHECK when opted in; skip by default for small/assignment work.
---

# Production readiness (optional)

Paths under `$SWE_WORKFLOW_DIR` (fall back `$WYISE_WORKFLOW_DIR`).

## When to run

Only when the orchestrator opted into PROD_CHECK (human asked, or auth / data /
public API / multi-service / ops risk). Otherwise skip and go to HUMAN_REVIEW.

## Inputs

- `$SWE_WORKFLOW_DIR/brief.md`, `plan.md`, `implementation.md`, `review.md`, `state.md`
- Actual git diff
- Invoke read-only subagent `production-reviewer`

## Process

1. Run `production-reviewer` with the diff + acceptance criteria + plan risks.
2. Severities:
   - **BLOCKER** — must fix or explicitly accept risk before ship
   - **WARNING** — should know; does not auto-block
   - **INFORMATIONAL** — context only
3. Write `$SWE_WORKFLOW_DIR/production-readiness.md`:

```markdown
# Production Readiness

Status: READY | NOT_READY

## Blockers

## Warnings

## Observability

## Rollout considerations

## Rollback plan

## What is already good

## Final recommendation
```

## State

- If blockers → `status: WAITING_FOR_HUMAN`, `NOT_READY`, stop
- If READY → `current_stage: HUMAN_REVIEW`, continue to `human-review`

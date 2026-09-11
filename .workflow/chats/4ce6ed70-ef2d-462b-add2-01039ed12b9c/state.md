# Workflow State

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

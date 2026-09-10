---
name: human-review
description: >-
  Builds a concise human review briefing for /swe without dumping the full
  diff. Waits for APPROVE or REQUEST_CHANGES. Use at HUMAN_REVIEW stage.
---

# Human review

Do **not** dump the entire diff. Brief the human so they know where to look.

Paths under `$SWE_WORKFLOW_DIR` (fall back `$WYISE_WORKFLOW_DIR`).

## Inputs

Read `$SWE_WORKFLOW_DIR/{brief,decisions,plan,implementation,review,production-readiness,state}.md`
(skip missing optional files) and skim the git diff for the 3–5 highest-risk hunks.

## Output

Write `$SWE_WORKFLOW_DIR/human-review.md`:

```markdown
# Your Review

You do NOT need to inspect every changed line.

Focus on:

### 1. <theme>
File: `<path>` (lines …)
Question: <one precise question>

### 2. <theme>
File: …
Question: …

### 3. <theme>
File: …
Question: …

## What changed (2–4 bullets)

## Why

## Behavior change

## Automated checks

- Diff minimizer:
- Code reviewer:
- Bug hunter:
- Tests:
- Production readiness: (skipped | …)

## What automated review did NOT check

## Remaining risk

## Decision needed

Reply with **APPROVE** or **REQUEST_CHANGES** (include what to change).
```

## State

- `current_stage: HUMAN_REVIEW`
- `status: WAITING_FOR_HUMAN`
- `required_human_decision: APPROVE or REQUEST_CHANGES`

Stop.

## On REQUEST_CHANGES

1. Record feedback in `human-review.md` and update `decisions.md` / `plan.md` if needed.
2. Return to IMPLEMENT → VERIFY → (optional PROD_CHECK) → HUMAN_REVIEW.
3. Do not ship.

## On APPROVE

Set `human_review_decision: APPROVE`, `current_stage: SHIP`,
`status: WAITING_FOR_HUMAN`, and ask whether to proceed to commit/PR
(still a separate gate — review APPROVE is not ship approval).

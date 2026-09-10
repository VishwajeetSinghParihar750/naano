---
name: shape
description: >-
  Human-led planning for /swe: investigate the codebase, surface real decisions,
  draft plan.md together, lock answers in decisions.md, wait for explicit
  approval to implement. Use during SHAPE / APPROVE. Do not implement.
---

# Shape (plan with the human)

**Do not implement.** Human steers; agent investigates and drafts.

Paths under `$SWE_WORKFLOW_DIR` (fall back `$WYISE_WORKFLOW_DIR`).

## Inputs

- `$SWE_WORKFLOW_DIR/brief.md`
- `$SWE_WORKFLOW_DIR/decisions.md` (create from template if missing)
- `$SWE_WORKFLOW_DIR/state.md`
- Repo conventions and relevant code

Never override `Status: LOCKED` decisions.

## Process

1. Restate the goal in plain English.
2. Locate relevant code; trace current behavior if fixing something.
3. Note constraints, unknowns, regression risks.
4. Prefer **one recommended approach**. Offer 2–3 options only when there is a
   real architectural fork — not by default.
5. Triage decisions: `BLOCKING` | `IMPORTANT` | `NON-BLOCKING`.
6. Ask only BLOCKING (and IMPORTANT when judgment truly matters).

For each question:

```text
Decision required:
<question>

A. ...
B. ...

Recommendation: <letter>
Reason: <one or two lines>
```

## Record answers

Append to `$SWE_WORKFLOW_DIR/decisions.md`:

```markdown
### D00N

- **Question:**
- **Options:**
  - A: ...
  - B: ...
- **Recommendation:**
- **Human decision:**
- **Reason:**
- **Timestamp:** <ISO-8601>
- **Status:** LOCKED
```

If any BLOCKING decision is unanswered, set `status: WAITING_FOR_HUMAN` and stop.

## Write the plan

After blocking decisions are LOCKED (or none needed), write
`$SWE_WORKFLOW_DIR/plan.md`:

```markdown
# Plan

## Objective

## Approach

## Scope

## Files likely to change

## Implementation sequence

## Test / verification

## Risks

## Out of scope
```

Keep it concrete and short. Skip empty sections that do not apply.

Optional light context (only if useful): fold problem/current-behavior notes into
the plan or a short section at the top — do **not** require a separate
`understanding.md` or Solutions A/B/C ritual.

## Approve gate

Update `$SWE_WORKFLOW_DIR/state.md`:

- `current_stage: APPROVE`
- `status: WAITING_FOR_HUMAN`
- `plan_approved: false`
- `required_human_decision: Approve shape / request changes`
- `next_action: Wait for explicit approval to implement`

Stop. Do not implement until the human explicitly approves
(e.g. "approve", "LGTM", "implement it", "go").

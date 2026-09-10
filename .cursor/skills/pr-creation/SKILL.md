---
name: pr-creation
description: >-
  Prepares commit and PR for /swe only after explicit human ship approval.
  Inspects repo PR/commit conventions. Never commits, pushes, or opens a PR
  without a fresh confirmation in the current turn.
---

# PR creation (SHIP)

Paths under `$SWE_WORKFLOW_DIR` (fall back `$WYISE_WORKFLOW_DIR`).

## Preconditions

- `human_review_decision: APPROVE`
- User explicitly asked to commit and/or open a PR **in this turn**
- `$SWE_WORKFLOW_DIR/state.md` may set `ship_approved: true` only after that confirmation

If either is missing: ask, set `WAITING_FOR_HUMAN`, stop.

## Inspect conventions

Look for:

- `.github/pull_request_template.md` / `PULL_REQUEST_TEMPLATE.md`
- `CONTRIBUTING.md`
- commit / branch conventions
- `CODEOWNERS`
- existing open PRs (`gh pr list` if available)

Prefer `gh`. No GitHub MCP required.

Author for commits when the user asks you to commit: use the repo / user git
identity. Never add AI attribution.

## Draft (before executing)

Write `$SWE_WORKFLOW_DIR/ship.md`:

```markdown
# Ship

## Branch

## Commit message

## PR title

## PR body

## Commands to run (pending approval)

- [ ] git commit
- [ ] git push
- [ ] gh pr create

## Human approvals

- Review APPROVE: yes/no
- Commit approved: pending
- Push approved: pending
- PR approved: pending
```

PR body (concise):

```markdown
## Summary

## What changed

## Testing

## Risks
```

If the repo has a PR template, fill that template instead.

## Execute only after explicit approval

For each of commit / push / PR create: confirm if not already confirmed.
Never `--force` to main/master. Never skip hooks unless the user insists.

After success, set `current_stage: COMPLETED`, `status: COMPLETED`.

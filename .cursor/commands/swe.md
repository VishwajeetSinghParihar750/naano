Orchestrate the `/swe` collaborative software-engineering workflow for this repo.

$ARGUMENTS

1. Read and follow `.cursor/skills/swe/SKILL.md`.
2. Resolve `$SWE_WORKFLOW_DIR` from session context (`.workflow/chats/<session_id>/`; fall back to `$WYISE_WORKFLOW_DIR` if present). Read `$SWE_WORKFLOW_DIR/state.md` first and resume from the correct stage.
3. Treat `$ARGUMENTS` as a task brief (goal, bug, feature, paste). Tickets are optional — not required.
4. If `$ARGUMENTS` is empty and a workflow is in progress **in this chat**, resume it. If empty and idle, ask what to work on.
5. Stop at every human gate. Do not implement before shape approval. Do not commit/push/create a PR without explicit approval in this turn.
6. Persist artifacts only under `$SWE_WORKFLOW_DIR/` as the stage skills specify. Never write to `.workflow/` root or another chat's folder.

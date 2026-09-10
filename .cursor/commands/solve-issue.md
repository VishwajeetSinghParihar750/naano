Alias for `/swe` (collaborative SWE workflow). Prefer `/swe`.

$ARGUMENTS

1. Read and follow `.cursor/skills/swe/SKILL.md` (not the legacy issue-ticket machine).
2. Resolve `$SWE_WORKFLOW_DIR` (or `$WYISE_WORKFLOW_DIR`) from session context. Read `state.md` first and resume.
3. Treat `$ARGUMENTS` as a task brief. Do not require a Linear/ticket id.
4. Same gates as `/swe`: shape approval before implement; explicit approval before commit/push/PR.
5. Persist artifacts only under this chat's `.workflow/chats/<session_id>/`.

# 09 — AI guide hover bar

## Meta
S09 · batch · depends S08 · unlocks S10

## Objective
Floating bottom bar: type a question → `POST /api/v1/guide` → animated pointer to a `data-tour-id` element with a caption.

## Design
- Tour registry (frontend + mirrored on backend for matching): id, route, caption, keywords.
- Backend: if `OPENAI_API_KEY` set, ask LLM to pick best tour id from the list; else keyword match; always return `{ tourId, caption, route }`.
- Frontend: GuideBar + GuidePointer overlay; navigate to route if needed; scroll into view; animate cursor.

## Anchors (minimum)
- creator-card, creator-opportunities, creator-collaborations
- brand-marketplace, brand-campaigns, brand-collaborations
- marketing-pricing, auth-demo

## Exit
Typing "how do I set my rate" points at creator card (when on creator); keyword fallback works without API key.

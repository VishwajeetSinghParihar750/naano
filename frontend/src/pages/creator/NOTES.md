# Creator API shape notes (S06 frontend)

Expected paths (relative to `VITE_API_URL`, typically `…/api/v1`):

| Method | Path | Response |
|--------|------|----------|
| GET | `/creator/me` | `{ profile: CreatorProfile }` |
| PATCH | `/creator/me` | `{ profile }` — body: name, headline, niche, country, ratePerPostCents, cardPublished |
| GET | `/creator/opportunities` | `{ opportunities: […] }` — invited (or filter client-side to `status === "invited"`) |
| POST | `/creator/collaborations/:id/accept` | `{ collaboration }` |
| POST | `/creator/collaborations/:id/decline` | `{ collaboration }` |
| GET | `/creator/collaborations` | `{ collaborations: […] }` (+ optional `deliverable`) |
| POST | `/creator/collaborations/:id/deliverable` | body `{ draftUrl }` → `{ collaboration, deliverable }` |

`CreatorProfile` fields used: `id`, `name`, `headline`, `niche`, `country`, `followers`, `ratePerPostCents`, `cardPublished`.

Opportunity / collaboration nested shape: `campaign: { title, brief }`, `brand: { company }`, plus `agreedRateCents` and `status`.

If the backend nests brand under `campaign.brand` or returns a bare profile (no `{ profile }` wrapper), adapt the page fetch mappers here and note the difference in this file.

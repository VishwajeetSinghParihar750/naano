# 06 — Creator app

## 1. Meta

- **ID**: S06
- **Status**: IN PROGRESS (batch)
- **Depends on**: S05
- **Unlocks**: S07 (brand invite loop completes against this)
- Master: routes → services → repositories; euro cents; collaboration status machine.

## 2. Objective

Give creators a working studio: edit card/rate, see opportunities (invites), accept/decline, list collaborations, submit a draft deliverable.

## 3. User-visible outcome

Logged-in creator at `/creator` can: set rate + publish card; see invited opportunities; accept → collaboration appears; submit draft URL on an accepted collab.

## 4. In scope / out of scope

In scope: creator profile GET/PATCH; opportunities list; accept/decline collaboration; list collaborations; submit deliverable; sidebar shell (Home, Card, Opportunities, Collaborations).
Out of scope: analytics, community, Stripe earnings (stub later), messaging, brand UI.

## 5. References

- `recon/authenticated/session/` creator studio screenshots
- Seeded invites for `amelie.dubois` (DevOps, status invited on RunAnywhere campaign)

## 6. IA (creator routes — client-side)

`/creator` home · `/creator/card` · `/creator/opportunities` · `/creator/collaborations`

## 7. UI

Sidebar + AppShell. Near-clone structure (not pixel). Rate shown as €. Status badges for collabs.

## 8. API (all require creator role)

- `GET /api/v1/creator/me` → profile
- `PATCH /api/v1/creator/me` → `{ ratePerPostCents?, headline?, niche?, country?, bio?, cardPublished?, name? }`
- `GET /api/v1/creator/opportunities` → collaborations where status=invited (or all with filter), include campaign + brand
- `POST /api/v1/creator/collaborations/:id/accept` → invited → accepted
- `POST /api/v1/creator/collaborations/:id/decline` → invited → declined
- `GET /api/v1/creator/collaborations` → all for this creator
- `POST /api/v1/creator/collaborations/:id/deliverable` → body `{ draftUrl }` — accepted → draft_submitted + create/update Deliverable submitted

## 9. Domain rules

- Only own profile/collabs. Invalid status transition → 409. Accept/decline only from invited. Deliverable only from accepted (or draft_submitted update).

## 10–14. Exit

Demo creator logs in, sets rate, accepts invite, sees collaboration; submit draft works. Build + commit.

# 07 — Brand app

## 1. Meta

- **ID**: S07 · batch · depends S06 · unlocks S08
- Master layering + status machine.

## 2. Objective

Brand can create campaigns, browse marketplace creators, invite (create collaboration), list collaborations, and advance draft_submitted → live → paid.

## 3. User-visible outcome

`/brand` shell: Overview, Marketplace, Campaigns, Collaborations. Happy path: create campaign → invite creator → see collab; approve draft → live → mark paid.

## 4. Scope

In: brand profile GET; campaigns CRUD (list/create/get); list published creators; invite; list collabs; approveDeliverable (→ live); markPaid (→ paid).
Out: AI matching, messaging, real wallet top-up (S08 stub), settings depth.

## 5. API (brand role)

- `GET /brand/me` → `{ profile }`
- `GET /brand/campaigns` → `{ campaigns }`
- `POST /brand/campaigns` → `{ title, brief, budgetCents }` → `{ campaign }` status active
- `GET /brand/creators` → `{ creators }` (cardPublished true)
- `POST /brand/campaigns/:id/invite` → `{ creatorProfileId }` → collab invited, agreedRate = creator rate
- `GET /brand/collaborations` → `{ collaborations }` with creator + campaign
- `POST /brand/collaborations/:id/approve` → draft_submitted → live (+ deliverable approved)
- `POST /brand/collaborations/:id/mark-paid` → live → paid

## 6. Domain

Own campaigns only. Unique (campaign, creator). Invite only on own campaign. Status 409 on bad transitions.

## 7. Exit

Demo brand logs in, creates campaign, invites a creator, sees collab; approve + mark-paid work on seeded draft_submitted/live rows.

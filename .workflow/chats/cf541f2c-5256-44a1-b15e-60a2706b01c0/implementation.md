# Implementation

## Summary

Implemented **S02 Data model + seed** per [specs/02-data-model.md](../../../specs/02-data-model.md): replaced `HealthCheck` with the 6-model domain schema + 4 enums, migrated it, added `bcryptjs`, and wrote an idempotent seed producing status-spanning demo data.

## Files changed

- `backend/prisma/schema.prisma` — enums (Role, CampaignStatus, CollaborationStatus, DeliverableStatus) + User, CreatorProfile, BrandProfile, Campaign, Collaboration, Deliverable
- `backend/prisma/migrations/20260910090953_domain_models/` — new migration (drops HealthCheck)
- `backend/prisma/seed.ts` — 15 creators, 2 brands, 4 campaigns, 6 collaborations, 3 deliverables
- `backend/package.json` — `bcryptjs` + `@types/bcryptjs`, `prisma.seed`, `db:seed`
- `README.md` — seed step + demo credentials
- `specs/02-data-model.md` — step spec

## Checks run

- `prisma migrate dev --name domain_models` — applied on the existing DB (HealthCheck dropped)
- `npm run db:seed` — counts: creators 15, brands 2, campaigns 4, collaborations 6, deliverables 3
- Re-ran seed — counts stable (idempotent)
- `groupBy status` — all six CollaborationStatus values present exactly once
- Typed client: `creatorProfile.count()` → 15 (prisma generate types compile)

## Deviations from plan

None. Defaults as agreed (Prisma enums, spanning seed, bcryptjs, one-to-one Deliverable).

## Notes for reviewers

- Demo accounts share `naano-demo-pass` (bcrypt, cost 10); used by S05 login and S08 demo.
- `walletBalanceCents` seeded on brands for the S08 billing stub.
- Deliverables only exist for `draft_submitted` (submitted) and `live`/`paid` (approved) — 3 total.
- `package.json#prisma.seed` triggers a deprecation warning (Prisma 7 wants `prisma.config.ts`); harmless for now.

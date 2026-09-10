# 02 — Data model + seed

## 1. Meta

- **ID**: S02
- **Status**: IMPLEMENTED (pending VERIFY / human review)
- **Depends on**: S01
- **Unlocks**: S05 (auth), S06 (creator app), S07 (brand app)
- Inherits all rules from [00-master.md](00-master.md). Decisions chosen (S02 questions skipped): Prisma enums, status-spanning seed, bcryptjs hashing, one-to-one Deliverable.

## 2. Objective

Replace the throwaway `HealthCheck` model with the real domain schema (User, CreatorProfile, BrandProfile, Campaign, Collaboration, Deliverable), migrate it, and seed recon-grounded demo data so both apps and the full collaboration lifecycle have realistic data the moment they are built.

## 3. User-visible outcome

None directly (no routes or UI yet). Outcome is a migrated database populated with 15 creators, 2 brands, 4 campaigns, and 6 collaborations spanning every status, plus demo accounts that will log in once S05 exists.

## 4. In scope / out of scope

In scope:
- Full Prisma schema with enums and the 6 domain models.
- One migration replacing `HealthCheck`.
- Idempotent seed script with demo data + hashed demo passwords.
- README seed step + demo credentials note.

Out of scope:
- Any API routes, services, repositories, or UI (S05+).
- Real auth/session logic (S05) — only the `passwordHash` column + seeded hashes.
- Real Stripe/LinkedIn. `walletBalanceCents` is a plain integer stub.
- More than one Deliverable per Collaboration.

## 5. References

- [00-master.md](00-master.md) §8 (entities), §9 (status machine), §10 (conventions: euro cents, uuid).
- `.workflow/chats/cf541f2c-5256-44a1-b15e-60a2706b01c0/recon-notes.md` (niches, rate ranges, brand loop).
- `.workflow/chats/cf541f2c-5256-44a1-b15e-60a2706b01c0/understanding.md` (root objects, creator card €240 example).

## 6. Information architecture

No routes. Data-layer only:
- Schema at [backend/prisma/schema.prisma](backend/prisma/schema.prisma).
- Seed at `backend/prisma/seed.ts`, invoked by `prisma db seed` / `npm run db:seed`.

## 7. UI spec

None.

## 8. Data model

Enums (lowercase values match master §9 wire format):

```prisma
enum Role { creator brand }
enum CampaignStatus { draft active completed }
enum CollaborationStatus { invited accepted declined draft_submitted live paid }
enum DeliverableStatus { pending submitted approved }
```

Models:

```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  role           Role
  passwordHash   String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  creatorProfile CreatorProfile?
  brandProfile   BrandProfile?
}

model CreatorProfile {
  id               String          @id @default(uuid())
  userId           String          @unique
  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  name             String
  headline         String
  niche            String
  country          String
  followers        Int
  ratePerPostCents Int
  cardPublished    Boolean         @default(false)
  avatarUrl        String?
  bio              String?
  collaborations   Collaboration[]
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
}

model BrandProfile {
  id                 String     @id @default(uuid())
  userId             String     @unique
  user               User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  company            String
  website            String?
  walletBalanceCents Int        @default(0)
  campaigns          Campaign[]
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
}

model Campaign {
  id             String          @id @default(uuid())
  brandProfileId String
  brand          BrandProfile    @relation(fields: [brandProfileId], references: [id], onDelete: Cascade)
  title          String
  brief          String
  budgetCents    Int
  status         CampaignStatus  @default(draft)
  collaborations Collaboration[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Collaboration {
  id               String              @id @default(uuid())
  campaignId       String
  campaign         Campaign            @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  creatorProfileId String
  creator          CreatorProfile      @relation(fields: [creatorProfileId], references: [id], onDelete: Cascade)
  status           CollaborationStatus @default(invited)
  agreedRateCents  Int
  deliverable      Deliverable?
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  @@unique([campaignId, creatorProfileId])
}

model Deliverable {
  id              String            @id @default(uuid())
  collaborationId String            @unique
  collaboration   Collaboration     @relation(fields: [collaborationId], references: [id], onDelete: Cascade)
  draftUrl        String?
  status          DeliverableStatus @default(pending)
  submittedAt     DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}
```

## 9. Domain rules

- All money is integer euro cents.
- `Collaboration` is unique per `(campaign, creator)`.
- Deliverable is optional and one-to-one; it exists once a creator submits a draft.
- Seeded statuses must cover the whole machine so the demo needs no manual setup.
- Referential integrity via `onDelete: Cascade` from `User` down.

## 10. File touch list

```
backend/prisma/schema.prisma                 # enums + 6 models (remove HealthCheck)
backend/prisma/migrations/<ts>_domain_models/ # new migration
backend/prisma/seed.ts                        # seed script (new)
backend/package.json                          # bcryptjs dep, prisma.seed, db:seed script
README.md                                     # seed step + demo credentials
```

## 11. Ordered implementation steps

1. Rewrite `schema.prisma`: add the 4 enums and 6 models; delete `HealthCheck`.
2. `npx prisma migrate dev --name domain_models` (drops the HealthCheck table, creates domain tables).
3. `npm install bcryptjs` (+ `@types/bcryptjs`).
4. Write `seed.ts`: clear tables (child→parent), create 15 creators, 2 brands, 4 campaigns, 6 status-spanning collaborations (with Deliverables where status implies one), all demo users sharing a bcrypt-hashed dev password.
5. Add `"prisma": { "seed": "tsx prisma/seed.ts" }` and `"db:seed": "tsx prisma/seed.ts"` to `package.json`.
6. Run `npm run db:seed`; then run again to prove idempotency.
7. Update README with the seed step and demo credentials.

## 12. Seed and fixtures

- **Creators (15)**: niches spanning DevOps, AI/ML, SaaS growth, Fintech, Cybersecurity, Product, Design, Sales, Data/Analytics, HR-tech, DevRel, Cloud, Marketing Ops, Founder-led, B2B copy. Followers 500-50,000. Rates EUR 40-500 (stored as cents). Most `cardPublished: true`.
- **Brands (2)**: e.g. `RunAnywhere`, `Northwind SaaS`, each with a non-zero `walletBalanceCents`.
- **Campaigns (4)**: realistic titles/briefs/budgets split across the two brands; mix of `draft`/`active`.
- **Collaborations (6)**: one each of `invited`, `accepted`, `declined`, `draft_submitted`, `live`, `paid`. `draft_submitted` has a Deliverable `status: submitted` with `submittedAt`; `live`/`paid` have a Deliverable `status: approved`.
- **Demo credentials**: shared dev password (e.g. `naano-demo-pass`) bcrypt-hashed; documented in README. Two headline demo logins: one creator, one brand.

## 13. Acceptance tests

Manual:
1. `npx prisma migrate reset --force` then `migrate dev` applies cleanly from empty.
2. `npm run db:seed` succeeds; re-running keeps counts stable (idempotent).
3. Row counts: 15 creators, 2 brands, 4 campaigns, 6 collaborations.
4. `SELECT DISTINCT status FROM "Collaboration"` returns all six values.
5. `npx prisma generate` succeeds; a scratch `tsx` import of `prisma.creatorProfile.findMany()` compiles and returns 15.

## 14. Exit criteria

- [ ] `schema.prisma` has the 4 enums + 6 models and no `HealthCheck`.
- [ ] Migration applies on a clean database.
- [ ] `db:seed` is idempotent (stable counts on re-run).
- [ ] Counts: 15 creators, 2 brands, 4 campaigns, 6 collaborations.
- [ ] Every `CollaborationStatus` value present at least once.
- [ ] `prisma generate` types compile.
- [ ] README documents the seed step and demo credentials.
- [ ] Committed with the `.agent-logs/` entries produced during this step.

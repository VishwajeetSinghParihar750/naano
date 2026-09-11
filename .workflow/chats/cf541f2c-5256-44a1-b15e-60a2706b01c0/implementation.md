# Implementation — Business rebuild S18–S23

## Summary

Brand/business workspace rebuilt to match b2bAd screenshots: icon-rail shell, company onboarding, dashboard, marketplace Book with wallet escrow, campaigns launch stubs, collaborations table, billing top-ups.

## Checks run

- `tsc --noEmit` frontend + backend: clean
- VERIFY: fixed escrow refund only when ledger escrow exists; conditional balance decrement; wallet pill refreshes on route change; CreateCampaignBody includes status; default campaign status draft

## Notes for reviewers

1. `docker compose up -d && cd backend && npx prisma migrate deploy && npx tsx prisma/seed.ts`
2. Demo brand: `growth@runanywhere.naano.test` / `naano-demo-pass`
3. Seed invites predate escrow (no debit); declining them does **not** inflate the wallet
4. New Book flow debits wallet; decline refunds only if escrow txn exists

# 04 — First deploy

## 1. Meta

- **ID**: S04
- **Status**: PREP DONE — live deploy pending your Vercel/Railway login
- **Depends on**: S03
- **Unlocks**: Public hand-in URL

## 2. Objective

Deploy the SPA to Vercel and the API + Postgres to Railway so a stranger can open a live public URL.

## 3. Current state

Deploy config is committed and ready:
- `frontend/vercel.json` (SPA rewrites, Vite build).
- `backend` prod scripts: `build` = `prisma generate && tsc`; `start` = `prisma migrate deploy && node dist/server.js`; `start:seed` for first deploy.
- Server binds `0.0.0.0` + `PORT` (Railway-ready).
- Full runbook in [DEPLOY.md](../DEPLOY.md).

## 4. Blocker

Live deploy requires interactive `vercel login` and `railway login` with your accounts. Not automatable here. Run the [DEPLOY.md](../DEPLOY.md) steps (or grant CLI tokens) and I'll finish wiring `CORS_ORIGIN` ↔ `VITE_API_URL` and smoke-test.

## 5. Exit criteria (on deploy)

- [ ] Vercel public URL serves marketing pages logged-out
- [ ] Railway `GET /api/v1/health` → `{ ok: true }`
- [ ] `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `VITE_API_URL` set
- [ ] Migrations + seed run on Railway
- [ ] Live URL added to README

# Deployment

Live deploy targets: **Vercel** (frontend) + **Railway** (API + Postgres). Both need your login, so run these when you're ready to authenticate.

## Railway (API + Postgres)

1. `npm i -g @railway/cli && railway login`
2. From repo root: `railway init` (create project `naano`).
3. Add a **PostgreSQL** plugin/service in the Railway dashboard.
4. Create an API service from the `backend/` directory:
   - Root directory: `backend`
   - Build: `npm install && npm run build`
   - Start: `npm run start:seed` (first deploy — migrates + seeds + serves), then switch to `npm run start`.
5. Set env vars on the API service:
   - `DATABASE_URL` → from the Postgres service (reference variable)
   - `SESSION_SECRET` → a strong random string
   - `CORS_ORIGIN` → the Vercel URL (set after step below; can start with `*`-free placeholder and update)
   - `NODE_ENV=production`
6. Note the public API URL, e.g. `https://naano-api.up.railway.app`.

## Vercel (frontend)

1. `npm i -g vercel && vercel login`
2. From `frontend/`: `vercel` (link/create project `naano`).
3. Set env var: `VITE_API_URL=https://<railway-api-url>/api/v1`
4. `vercel --prod` → note the public URL, e.g. `https://naano.vercel.app`.

## Wire the two together

- Set Railway `CORS_ORIGIN` to the exact Vercel origin (no trailing slash).
- Redeploy the API so CORS + cookies (SameSite=None; Secure) accept the Vercel origin.

## Verify

- Open the Vercel URL logged-out: marketing pages load.
- `curl https://<railway-api-url>/api/v1/health` → `{"ok":true}`.
- Register/login (after S05) sets a cookie and lands in the correct app.

## Config already in the repo

- `frontend/vercel.json` — SPA rewrites + Vite build.
- `backend` scripts: `build` (prisma generate + tsc), `start` (migrate + serve), `start:seed` (first deploy).
- Server binds `0.0.0.0` and honors `PORT` — Railway-compatible.

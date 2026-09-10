# 01 — Bootstrap

## 1. Meta

- **ID**: S01
- **Status**: IMPLEMENTED (pending VERIFY / human review)
- **Depends on**: —
- **Unlocks**: S02 (data model), S03 (marketing)
- Inherits all rules from [00-master.md](00-master.md).

## 2. Objective

Stand up the thinnest possible three-tier skeleton — React SPA, Fastify API, Postgres — and prove they run and talk to each other. Establish the plumbing (CORS, cookie-ready fetch wrapper, Prisma migration, Docker Postgres) once so no later step re-litigates it.

## 3. User-visible outcome

Running the documented commands locally brings up a single page that shows **"API: ok"**, backed by a live `GET /api/v1/health` call through the shared fetch wrapper, with Postgres up and a Prisma migration applied. Nothing else is user-facing yet.

## 4. In scope / out of scope

In scope:
- `backend/` Fastify + TypeScript with one health route and CORS.
- `frontend/` Vite + React + TS + Tailwind with one page and `lib/api.ts`.
- Prisma wired to Postgres with a single throwaway model proving migrations run.
- Root `docker-compose.yml` for Postgres.
- Root `.gitignore`, `README.md`, and `.env.example` files.

Out of scope (later steps):
- Any real domain model or seed data (S02).
- Auth, sessions, login UI (S05).
- Marketing pages (S03), deploy (S04).
- Tailwind design tokens beyond defaults.

## 5. References

None from `recon/` — this step has no visual surface. Reference is [00-master.md](00-master.md) §4 (architecture), §5 (stack), §6 (repo layout), §10 (conventions).

## 6. Information architecture

- Backend route: `GET /api/v1/health`.
- Frontend: a single route `/` rendering one `HealthPage` component. No router library required yet (added in S03/S05 when multiple routes exist).

## 7. UI spec

Deliberately unstyled beyond Tailwind base. One centered card:
- Title: `Naano (rebuild)`.
- A status line: `API: ok` in green when health resolves `{ ok: true }`, `API: down` in red on failure, `API: …` while pending.
- No colors/typography from the brand yet; that begins in S03.

## 8. API contracts

### `GET /api/v1/health`
- Auth: none.
- Response `200`:
```json
{ "ok": true }
```
- No error branch expected; if the process is up it returns ok. DB connectivity is proven by the migration at build time, not by this endpoint (kept dependency-free on purpose).

## 9. Domain rules

None. The `HealthCheck` model exists only to prove `prisma migrate` runs against an empty database; it carries `id` (uuid) and `createdAt` and is replaced in S02.

## 10. File touch list

```
docker-compose.yml
.gitignore
README.md

backend/
  package.json
  tsconfig.json
  .env.example
  src/
    server.ts            # Fastify instance, CORS, listen
    routes/health.ts     # GET /api/v1/health
    lib/prisma.ts        # PrismaClient singleton
  prisma/
    schema.prisma        # datasource + generator + HealthCheck model

frontend/
  package.json
  tsconfig.json
  index.html
  .env.example
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  src/
    main.tsx
    App.tsx
    pages/HealthPage.tsx
    lib/api.ts           # fetch wrapper, credentials:'include', base VITE_API_URL
    index.css            # tailwind directives
```

## 11. Ordered implementation steps

1. Root: `docker-compose.yml` (Postgres 16, volume, port 5432, healthcheck), `.gitignore` (node_modules, dist, `.env`, build output — **not** `.agent-logs/`), `README.md` skeleton.
2. Backend: init `package.json`, TypeScript, Fastify, `@fastify/cors`, Prisma. Add `server.ts` with CORS (`origin: CORS_ORIGIN`, `credentials: true`) and register `routes/health.ts` under the `/api/v1` prefix.
3. Backend: `schema.prisma` datasource (`env("DATABASE_URL")`) + `HealthCheck` model; `prisma/lib` client singleton; run initial migration.
4. Backend: `.env.example` with `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`; scripts `dev`, `build`, `migrate`.
5. Frontend: scaffold Vite React TS, add Tailwind (config + `index.css` directives).
6. Frontend: `lib/api.ts` fetch wrapper reading `VITE_API_URL`, always `credentials: 'include'`, returning parsed JSON or throwing the `{ error }` shape.
7. Frontend: `HealthPage` calls `api.get('/health')` on mount and renders the status line; wire into `App.tsx`.
8. `README.md`: document the run sequence and env setup.

## 12. Seed and fixtures

None.

## 13. Acceptance tests

Manual:
1. `docker compose up -d` → Postgres healthy.
2. In `backend/`: copy `.env.example` → `.env`, `npm install`, `npm run migrate` succeeds on an empty DB, `npm run dev` serves.
3. `curl http://localhost:<api-port>/api/v1/health` → `{"ok":true}`.
4. In `frontend/`: copy `.env.example` → `.env`, `npm install`, `npm run dev`; open the page → shows **API: ok**.
5. Stop the backend, reload the page → shows **API: down** (proves the wrapper's error path).

## 14. Exit criteria

- [ ] `docker compose up` brings up Postgres locally.
- [ ] `prisma migrate` applies cleanly to an empty database.
- [ ] `GET /api/v1/health` returns `{ ok: true }`.
- [ ] Frontend renders **API: ok** against the local API through `lib/api.ts`.
- [ ] Frontend renders **API: down** when the API is unreachable.
- [ ] `.gitignore` excludes `node_modules`/`dist`/`.env` and does **not** exclude `.agent-logs/`.
- [ ] `README.md` documents the full local run sequence.
- [ ] Committed with the `.agent-logs/` entries produced during this step.

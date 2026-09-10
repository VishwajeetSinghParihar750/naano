# Plan

## Objective

Implement **S01 Bootstrap** per [specs/01-bootstrap.md](../../../specs/01-bootstrap.md): React SPA + Fastify API + Docker Postgres, with health check proving they talk.

## Approach

Follow the approved master contract ([specs/00-master.md](../../../specs/00-master.md)) and S01 spec exactly. Smallest correct scaffolding; no domain features.

## Scope

- `docker-compose.yml`, root `.gitignore`, `README.md`
- `backend/` Fastify + Prisma + `GET /api/v1/health`
- `frontend/` Vite React TS Tailwind + HealthPage + `lib/api.ts`

## Files likely to change

Listed in `specs/01-bootstrap.md` §10.

## Implementation sequence

As in `specs/01-bootstrap.md` §11.

## Test / verification

Manual acceptance tests in `specs/01-bootstrap.md` §13–14, then VERIFY agents.

## Risks

- Existing root `package.json` (puppeteer recon) — leave alone; FE/BE are separate folders.
- CORS/cookie plumbing must be correct even before auth (S05).

## Out of scope

Auth, domain models beyond throwaway HealthCheck, marketing, deploy.

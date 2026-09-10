# Decisions

Locked decisions for this chat's `/swe` run. Never silently override
`Status: LOCKED`.

| ID | Decision | Choice | Status | Notes |
|---|---|---|---|---|
| D001 | MVP shape | A — thin two-sided marketplace | LOCKED | Both `/creator` and `/brand` happy paths |
| D002 | Stack | B — separate FE / BE / DB | LOCKED | React (Vite) SPA + Fastify + Prisma/Postgres |
| D003 | Visual parity | B — near-clone of official site | LOCKED | Structure/color/type from `recon/`, not pixel-diff |
| D004 | Auth | httpOnly cookie session | LOCKED | `credentials: include`; SameSite=None; Secure in prod |
| D005 | Backend layering | routes → services → repositories | LOCKED | Only repositories touch Prisma |
| D006 | Local DB | Docker Compose Postgres | LOCKED | S01 |
| D007 | Repo structure | Two independent package.json folders | LOCKED | No root npm workspaces |
| D008 | AI guide intent | Real LLM via backend | LOCKED | S09; keyword fallback if LLM fails |

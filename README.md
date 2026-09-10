# Naano rebuild

Thin two-sided LinkedIn creator marketplace rebuild for the 8x assignment.

Specs live in [`specs/`](specs/). Architecture and conventions: [`specs/00-master.md`](specs/00-master.md).

## Stack

| Layer | Choice |
|---|---|
| Frontend | React SPA (Vite) + Tailwind |
| Backend | Fastify + TypeScript |
| Database | PostgreSQL via Prisma |
| Local DB | Docker Compose |

## Prerequisites

- Node 20+
- Docker + Docker Compose
- npm

## Local setup

### 1. Start Postgres

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run migrate:dev
# or, after the init migration is already in the repo:
# npm run migrate
npm run dev
```

API listens on **http://localhost:8080**. Health check:

```bash
curl http://localhost:8080/api/v1/health
# {"ok":true}
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173** — you should see **API: ok**.

## Environment

**Backend** (`backend/.env`):

| Variable | Example |
|---|---|
| `DATABASE_URL` | `postgresql://naano:naano@localhost:5435/naano` |
| `SESSION_SECRET` | `dev-session-secret-change-me` |
| `CORS_ORIGIN` | `http://localhost:5173` |
| `PORT` | `8080` |

**Frontend** (`frontend/.env`):

| Variable | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` |

## Notes

- Root `package.json` / `node_modules` are for recon Puppeteer scripts only — not the product app.
- `.agent-logs/` is committed with the repo (do not gitignore).

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
# or, after migrations are already in the repo:
# npm run migrate
npm run db:seed
npm run dev
```

`npm run db:seed` loads demo data: 15 creators, 2 brands, 4 campaigns, and 6
collaborations spanning every status. It is idempotent (safe to re-run).

**Demo credentials** (all seeded accounts share one password):

| Role | Email | Password |
|---|---|---|
| Creator | `amelie.dubois@creator.naano.test` | `naano-demo-pass` |
| Brand | `growth@runanywhere.naano.test` | `naano-demo-pass` |

Login is wired in S05; the hashes are seeded now so those accounts work once auth ships.

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

## Demo walkthrough

Use the seeded accounts above (or the **Demo as creator** / **Demo as brand**
buttons on `/login`).

1. **Brand invite** — Sign in as the brand → Marketplace → Invite a published
   creator onto one of your campaigns.
2. **Creator accept** — Sign out → sign in as the creator → Opportunities →
   Accept the invite.
3. **Draft** — On Collaborations, paste a draft URL and submit.
4. **Brand approve** — Sign back in as the brand → Collaborations → Approve the
   draft (moves the collab to live).
5. **Mark paid** — Still on brand Collaborations → Mark paid.

Stubs for the demo: brand **Results** (`/brand/results`) shows placeholder
metrics; creator **Earnings** (`/creator/earnings`) shows €0 with Connect
Stripe disabled until real payouts ship.

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

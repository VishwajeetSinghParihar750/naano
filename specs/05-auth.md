# 05 — Auth + role fork

## 1. Meta

- **ID**: S05
- **Status**: IN PROGRESS (batch)
- **Depends on**: S02, S03
- **Unlocks**: S06 (creator app), S07 (brand app)
- Inherits [00-master.md](00-master.md): cookie session, `/api/v1/*`, error shape, `routes → services → repositories`.

## 2. Objective

Let users register and log in with an httpOnly cookie session, forked by role, and land in the correct app shell. Wrong-role access is blocked. Seeded demo accounts work.

## 3. User-visible outcome

- `/register` first asks role (creator or brand), then collects email + password, creates the account, and redirects to `/creator` or `/brand`.
- `/login` signs in and redirects by role.
- `/creator` and `/brand` are guarded shells (minimal until S06/S07); wrong role is blocked; logged-out users are redirected to `/login`.
- Sign out clears the session.

## 4. In scope / out of scope

In scope:
- Backend: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me`; cookie session; bcrypt verify; zod validation; services + repositories.
- Frontend: real `/login`, `/register` (role fork) near-clone of `recon/auth/`; auth context; route guards; minimal `/creator` + `/brand` shells with sign-out.
- Cross-site cookie config (SameSite=None; Secure in prod; Lax in dev).

Out of scope:
- OAuth (LinkedIn/Google) — show disabled buttons.
- Password reset, email verification/OTP.
- App feature surfaces (S06/S07).

## 5. References

- `recon/auth/06-login.png` + `.json` (Welcome back; email/password; OAuth buttons; Forgot password)
- `recon/auth/07-register.png` + `.json` (role fork "First, who are you here as?"; I'm a creator / I'm a brand)

## 6. Information architecture

| Route | Page | Guard |
|---|---|---|
| `/login` | Login | redirect to app if already authed |
| `/register` | Role fork → form | redirect if authed |
| `/creator` | Creator shell | role=creator only |
| `/brand` | Brand shell | role=brand only |

Role mapping: query `role=influencer` → creator, `role=saas` → brand (master §10).

## 7. UI spec

- Split-screen auth (form left, brand story right) per recon; sky/navy tokens from S03.
- Register step 1: two big role cards (creator / brand) with the recon copy.
- Register step 2: email + password (+ display name optional). OAuth buttons visible but disabled with a small "coming soon".
- Login: email + password, disabled OAuth, link to register.
- Errors: inline message from `{ error: { code, message } }`.

## 8. API contracts

All under `/api/v1`. JSON. Cookie `naano_session` (httpOnly).

### `POST /auth/register`
Body: `{ email, password, role: "creator"|"brand", name? }`
- 201 → `{ user: { id, email, role } }` + Set-Cookie. Creates matching profile row (CreatorProfile or BrandProfile with sensible defaults).
- 409 if email exists; 400 on validation.

### `POST /auth/login`
Body: `{ email, password }`
- 200 → `{ user: { id, email, role } }` + Set-Cookie.
- 401 on bad credentials.

### `POST /auth/logout`
- 204, clears cookie.

### `GET /me`
- 200 → `{ user: { id, email, role } }` or 401.

## 9. Domain rules

- Password ≥ 8 chars; bcrypt (cost 10) — matches seed hashes.
- Session token: signed (SESSION_SECRET) opaque id → user lookup; stored in httpOnly cookie; no JWT in JS.
- Register creates the profile for the role in one transaction. Creator defaults: name from `name` or email prefix, rate 0, cardPublished false. Brand defaults: company from `name` or email prefix.
- `me` is the single source of truth for the frontend auth state.

## 10. File touch list

```
backend/src/lib/session.ts            # sign/verify cookie, config
backend/src/lib/auth.ts               # requireUser preHandler
backend/src/repositories/user.repo.ts
backend/src/services/auth.service.ts
backend/src/routes/auth.ts            # register/login/logout
backend/src/routes/me.ts
backend/src/server.ts                 # register @fastify/cookie + routes
backend/package.json                  # @fastify/cookie, zod, bcryptjs(existing)

frontend/src/lib/auth.tsx             # AuthProvider + useAuth (me/login/register/logout)
frontend/src/components/RequireRole.tsx
frontend/src/pages/auth/LoginPage.tsx        # replaces placeholder
frontend/src/pages/auth/RegisterPage.tsx     # replaces placeholder
frontend/src/pages/app/CreatorShell.tsx      # minimal
frontend/src/pages/app/BrandShell.tsx        # minimal
frontend/src/App.tsx                  # routes + guards + provider
```

## 11. Ordered implementation steps

1. Backend: add `@fastify/cookie`, `zod`. Session lib (sign/verify, cookie opts by NODE_ENV). User repo + auth service. Routes register/login/logout/me. Register cookie plugin in server.
2. Verify with curl: register → cookie → me → logout.
3. Frontend: AuthProvider (calls `/me` on load), login/register pages (role fork), RequireRole guard, minimal shells with sign-out, wire routes.
4. Build + Puppeteer: register brand → lands `/brand`; wrong role guard; demo login works.

## 12. Seed and fixtures

Uses S02 seed. Demo: `amelie.dubois@creator.naano.test` / `growth@runanywhere.naano.test`, password `naano-demo-pass`.

## 13. Acceptance tests

1. `curl` register new creator → 201 + cookie; `me` → that user; logout → 204; `me` → 401.
2. Duplicate email → 409; bad login → 401.
3. Seeded demo login (both roles) → 200.
4. Puppeteer: register via UI (brand) → redirected to `/brand`; visiting `/creator` as brand → blocked; sign out → `/login`.
5. `npm run build` (frontend) + `tsc` (backend) pass.

## 14. Exit criteria

- [ ] register/login/logout/me work with httpOnly cookie
- [ ] role fork on register; redirect to correct app
- [ ] wrong-role access blocked; logged-out redirected
- [ ] seeded demo accounts log in
- [ ] both builds pass
- [ ] committed with `.agent-logs/`

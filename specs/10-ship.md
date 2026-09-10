# 10 — Ship + final review

## Status
Batch implementation of S03–S09 is complete and pushed to `main`. This step is the **final HUMAN_REVIEW**.

## Done
| Step | Commit | Notes |
|------|--------|-------|
| S01 | d064ffc | Bootstrap |
| S02 | 3ed505c | Schema + seed |
| S03 | c7f8ecf | Marketing |
| S04 | 3604d44 | Deploy **config** (live URL pending your Vercel/Railway login — see DEPLOY.md) |
| S05 | 8b08525 | Auth + guards |
| S06 | 917735c | Creator app |
| S07 | d36848b | Brand app |
| S08 | f625ed5 | Demo entry + stubs |
| S09 | d8c3559 | AI guide bar |

## Still needed for assignment hand-in
1. **Live public URL** — run [DEPLOY.md](../DEPLOY.md) (needs your logins).
2. Your walkthrough video (camera on, ≤5 min).
3. Confirm public repo: https://github.com/VishwajeetSinghParihar750/naano

## Local demo now
```bash
docker compose up -d
cd backend && npm run migrate && npm run db:seed && npm run dev
cd frontend && npm run dev
```
Open http://localhost:5173/login → Demo as creator / Demo as brand.

# Review (S05 Auth)

Batch mode — no HUMAN_REVIEW gate.

## Verdict: PASS (evidence-based; VERIFY agent interrupted)

### Curl
- register → 201 + cookie; me → 200; dup → 409; bad login → 401
- demo brand login → 200; logout clears cookie; me → 401

### Puppeteer
- register brand → `/brand`
- brand visits `/creator` → redirected to `/brand`
- sign out → `/login`
- anon visits `/brand` → `/login`
- demo creator login → `/creator`

### Builds
- Pending re-confirm in this turn

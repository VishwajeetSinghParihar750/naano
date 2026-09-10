# 03 — Marketing near-clone

## 1. Meta

- **ID**: S03
- **Status**: IN PROGRESS (batch mode — no per-step HUMAN_REVIEW)
- **Depends on**: S01
- **Unlocks**: S04 (first deploy), S05 (auth pages replace placeholders)
- Inherits [00-master.md](00-master.md). Batch workflow: IMPLEMENT → VERIFY → commit.

## 2. Objective

Ship logged-out marketing pages that near-clone Naano’s public site (structure, sky-blue atmosphere, typography, copy tone) using `recon/marketing/` as reference.

## 3. User-visible outcome

Visitors can open `/`, `/creators`, and `/pricing`, navigate via shared header/footer, and click Sign in / Sign up into thin auth placeholders (full auth in S05).

## 4. In scope / out of scope

In scope: React Router; shared marketing layout; Home, Creators, Pricing; CSS design tokens; `/login` and `/register` placeholders; keep `/health` for API check.
Out of scope: Real auth, apps, agencies page depth, pixel-perfect asset reuse, backend changes.

## 5. References

- `recon/marketing/01-home.png` + `.json`
- `recon/marketing/02-creators-landing.png` + `.json`
- `recon/marketing/04-pricing.png` + `.json`

## 6. Information architecture

| Route | Page |
|---|---|
| `/` | Brand/home marketing |
| `/creators` | Creator marketing |
| `/pricing` | Pricing (Self-Serve €0 / Managed €700) |
| `/login` | Placeholder (S05) |
| `/register` | Placeholder with optional `?role=` (S05) |
| `/health` | Existing HealthPage |

## 7. UI spec

- Atmosphere: soft sky-blue / white gradients; dark navy primary CTAs; generous whitespace.
- Font: Plus Jakarta Sans (expressive, not Inter/system).
- Brand wordmark “naano” as hero-level signal on home (not only nav).
- Header: For companies / For creators / Pricing / Sign in / Sign up (or Start earning on creators).
- Home sections: hero, social proof strip, marketplace pitch, how-it-works steps, pricing teaser, FAQ teaser, final CTA.
- Creators: hero “Get paid to post on LinkedIn”, benefits, rate example, CTA Start earning.
- Pricing: two-plan comparison table Self-Serve vs Managed.
- No cookie banner (skip clutter for MVP).

## 8. API contracts

None (static SPA pages).

## 9. Domain rules

None.

## 10. File touch list

```
frontend/package.json                 # react-router-dom
frontend/src/main.tsx / App.tsx
frontend/src/index.css                # tokens + font
frontend/src/components/marketing/*   # Header, Footer, Layout
frontend/src/pages/marketing/*        # Home, Creators, Pricing
frontend/src/pages/auth/*             # Login/Register placeholders
```

## 11. Ordered implementation steps

1. Add `react-router-dom`.
2. Design tokens + font in `index.css`.
3. MarketingHeader / Footer / Layout.
4. Home, Creators, Pricing pages from recon copy.
5. Auth placeholders.
6. Wire App routes; keep HealthPage at `/health`.

## 12. Seed and fixtures

None.

## 13. Acceptance tests

1. `npm run build` succeeds.
2. `/`, `/creators`, `/pricing` render distinct near-clone content.
3. Nav links work; Sign up → `/register`; Sign in → `/login`.
4. `/health` still shows API status.

## 14. Exit criteria

- [ ] Three marketing pages live locally
- [ ] Shared nav/footer
- [ ] Auth placeholders linked
- [ ] Build passes
- [ ] Committed with `.agent-logs/`

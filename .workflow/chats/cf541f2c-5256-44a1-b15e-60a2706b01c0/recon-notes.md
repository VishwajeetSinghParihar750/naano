# Product recon — naano.com

Captured with Puppeteer into `recon/` (marketing, auth, creator, business).
Authenticated in-app dashboards are only partially reachable (email OTP + LinkedIn
import gate). Public product model is clear.

## What Naano is

A **two-sided B2B LinkedIn creator marketplace**:

| Side | Role query param | Job |
|---|---|---|
| **Creator** (`influencer`) | `/register?role=influencer` | Set a fixed €/post rate, get booked by brands, deliver a LinkedIn post, get paid (~24h, Stripe) |
| **Brand** (`saas`) | `/register?role=saas` | Find creators by audience fit, brief + book campaigns, track clicks/leads/pipeline, pay per post |
| **Agency** (extra) | `/agencies` → brand agency or talent agency | Multi-client brand ops **or** manage a creator roster without creator logins |

Thesis (from site / `llms.txt`): B2B buyers trust people more than brands; personal LinkedIn posts outperform company pages; vertical fit beats raw follower count.

## Money model

- Creators set **flat fee per post** (from ~€20; medians rise with follower tier)
- Brand plans: **Self-Serve €0/mo** (pay creators) or **Managed €700/mo** (Naano operates)
- Campaign spend is separate from platform fee
- Platform is counterparty → payouts without creator↔brand invoices (Stripe Connect)

## Brand loop (product pattern)

1. Land on marketing → Sign up as brand  
2. Auth (LinkedIn / Google / email+OTP)  
3. **Find creators** (fit %, vertical, audience)  
4. **Build campaign brief** (objectives, messages, guidelines, tracking links) — marketed as AI-assisted  
5. **Book / manage collaborations** (draft → scheduled → live)  
6. **Track** views, clicks, leads, attributed pipeline  
7. **Pay** creators via platform  

Screenshot-backed: marketing home, pricing, selection tool, agencies, register role fork, brand email signup + OTP screen.  
Inferred (mockups / copy): marketplace search UI, brief builder, campaign board, ROI dashboard.

## Creator loop (product pattern)

1. Land `/creators` → Sign up as creator  
2. Auth → email OTP (**verified in recon**)  
3. **Step 2/4:** paste public LinkedIn URL → import Basic card (name, photo, headline, country, followers via Apify; no private analytics) — **screenshot-backed**  
4. Later steps (inferred from “Step 1 of 4” + card preview): enrich card, set **cost/post**, positioning / ICP  
5. Ongoing: opportunities / deals, deliver post, payouts, performance  

Screenshot-backed: creator landing, register, email form, OTP, LinkedIn-import step + live marketplace card preview.  
Blocked without finishing LinkedIn import + remaining steps: full creator dashboard.

## UX / UI patterns observed

- Split-screen auth (form left, brand story / live card right)
- Strong two-role fork early (“I'm a creator” / “I'm a brand”)
- Creator onboarding sells the **marketplace card** as the artifact brands trust
- Marketing: light sky-blue atmosphere, product mockups as journey steps, lots of social proof
- EN language toggle; OAuth preferred but email path exists

## Assignment read (what we must hand in)

Not “clone every Naano feature.” Rebuild a **live, public** version of this product idea with judgement on MVP scope, good UX, and speed. Deliver:

1. Live URL (works logged-out for a stranger)  
2. Public GitHub repo with `.agent-logs/` committed as we go  
3. ≤5 min walkthrough, camera on  

Capture setup already green (`CAPTURE-TEST.md`).

## Gaps

- Full post-onboarding app shells (campaigns, opportunities, payouts) not fully screenshot-walked
- Real LinkedIn OAuth path not used (email path used instead)
- Agency workspaces only at marketing / entry URLs

## Recon index

See `recon/manifest.json`, `recon/manifest-deep.json`, and folders:
`recon/marketing/`, `recon/auth/`, `recon/creator/`, `recon/business/`.

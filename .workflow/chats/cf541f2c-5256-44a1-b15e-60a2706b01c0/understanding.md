# Issue Understanding

## Problem

Rebuild **Naano** (https://naano.com) for the 8x assignment: a live, public
two-sided B2B LinkedIn creator marketplace. Judged on working product, what we
choose to build vs cut, and UX quality — not a 1:1 clone. Hand-in: live URL +
public GitHub (with `.agent-logs/` committed as we go) + ≤5 min walkthrough
(camera on).

## What is happening today

### Product thesis

Naano is a **marketplace + workflow OS** for B2B LinkedIn creator campaigns:

- Brands book creators at a **fixed €/post** (creator sets the price).
- Every collaboration is meant to produce a trackable post (clicks → leads → pipeline).
- Platform is the counterparty for money (Stripe / payouts); no bilateral invoices.
- Two plans for brands: Self-Serve €0/mo vs Managed €700/mo (campaign spend separate).

### Architecture of the live product (verified)

| Surface | URL pattern | Notes |
|---|---|---|
| Marketing | `/`, `/creators`, `/pricing`, `/agencies`, … | Public |
| Auth | `/login`, `/register?role=influencer\|saas` | Role fork before account |
| **Creator studio** | **`/creator`** (+ hash sections, e.g. `#home`, `#profile`) | **Authenticated — captured** |
| **Brand app** | **`/brand`** (+ `#overview`, `#marketplace`, `#campaigns`, `#billing`, `#settings`, `#messages`, `#integrations`) | **Authenticated — captured** |
| Team | `/brand/settings/members` | Multi-seat |
| Agency / client | `/agency`, `/client` | Separate modes |
| Dead paths | `/app`, `/marketplace`, `/campaigns`, `/billing`, `/wallet`, … | Many return **404**; real apps are `/creator` and `/brand` |

### Creator journey (public → in-app, verified)

1. **Register** as creator (`role=influencer`) — LinkedIn / Google / email  
2. Email OTP (verified earlier in headless recon)  
3. Import public LinkedIn URL → Basic marketplace card (Apify; name/photo/headline/followers)  
4. Land in **Creator studio** at `/creator`  
5. Guided tour (Step 1 of 5 seen): Marketplace card editor / storefront  
6. Ongoing product areas (all present in authenticated DOM / UI):

#### Creator studio IA (authenticated)

Sidebar + sections observed in **Naano - Creator studio**:

| Area | What it does (from live UI) |
|---|---|
| **Welcome / home** | Glance metrics: public post reach, posts, engagements, LinkedIn followers |
| **Creator card / storefront** | “How brands discover you”; Open / Copy link / Share; chosen cost (example **€240**); Publish card |
| **Launch guide** | Checklist (“Card and price ready” → Complete) |
| **Opportunities** | Browse/search campaigns & brands; filters by industry & country; tabs: All / Active / Needs action / Applications sent / Declined / Completed |
| **Gate** | **“Paid campaigns open at 1,000 followers”** — soft gate for paid work |
| **Collaborations** | Table: Brand · Status · Next action · Due · Net (brief → publication) |
| **Analytics** | Public LinkedIn posts import status + performance views |
| **Community** | Creator community / leaderboard framing |
| **Earnings** | Balance (€0), Connect Stripe, Withdraw, Awaiting release, Invoices |
| **Messages** | Conversation search + compose |
| **Integrations** | “Connect your AI assistant” / Connect Naano |
| **Settings** | Personal profile, social links, **price per post (net to you)**, company/billing, bank details, LinkedIn refresh, delete account |

Header chrome: wallet **€0**, EN/FR, notifications, profile, Sign out, Guided tour.

**Creator storefront** (`#profile` tour): card is framed as a **deal link** brands can join through; copy mentions **“YOUR SHARE 25%”** and **“REWARD PERIOD 3 months”** (referral/affiliate-style economics on the card — important product nuance beyond flat post fee).

Evidence: `recon/authenticated/session/00-home-after-login.*`, `01-_dashboard.*`, `01-_onboarding.*`.

### Brand journey (public → in-app, verified)

1. Register as brand (`role=saas`) → auth  
2. Land in **Brand app** at `/brand` (title: “Multi-network creator platform”)  
3. Onboarding / welcome campaign flow (seen: `welcomeCampaign=…&welcomeStep=creators#marketplace`)  
4. Launch campaign via one of three paths: **Launch free with Naano team** · **Create with AI** · **Start from your link** (Notion/Docs/PDF brief URL)  
5. Select creators via **AI Matching** and/or **Creator Marketplace** (search, shortlist, invite)  
6. Manage **Campaigns** (All / Active / Draft / Completed) and **Collaborations**  
7. Track **Results** (performance over time, spend breakdown)  
8. **Messaging**, **Billing** (wallet €, Add budget), **Settings** (profile, audience, team, integrations, Pixel Naano, MCP)

#### Brand app IA (authenticated)

Sidebar observed for company **RunAnywhere**:

| Area | What it does (from live UI) |
|---|---|
| **Overview** | Home pulse: to-dos, messages, new creators, book-a-call CTA |
| **Creators** | Tabs: **AI Matching** (prompt + suggested queries using campaign brief) · **Creator Marketplace** (“All creators” count, Shortlist) |
| **Campaign** | List + create; statuses All/Active/Draft/Completed; brief text; Creators / Published / Committed budget; Open campaign / My brief |
| **Collaboration** | Creator work moving through delivery |
| **Results** | Performance over time + spend breakdown |
| **Messaging** | Conversations |
| **Billing** | Wallet (€0.00), Add budget |
| **Settings** | Profile, Audience, Team & access (`/brand/settings/members`), Integrations, Pixel Naano, Connect Naano / MCP, Agency mode |

Header: wallet **€0.00**, EN/FR, Get Started progress (e.g. Discover Marketplace 1/3), Invite Creators, Book a call, Sign out.

Campaign creation options seen: New campaign · Create with AI · Start from my link · Copy/share public brief · Invite creators · AI Matching.

Evidence: `recon/authenticated/brand/00-home-after-login.*`, `01-_brand_*.*`.

### Agency (secondary)

`/agencies` → brand agency (`/agency`) or creator/talent agency (`/talent-agency`). Also **Agency mode** toggle inside brand app. Skip for MVP unless trivial.

## Relevant code / artifacts (this repo)

No product app yet. Recon only:

- `recon/marketing/`, `recon/auth/`, `recon/creator/`, `recon/business/` — public + signup
- `recon/authenticated/session/` — **creator studio** after human login
- `recon/authenticated/brand/` — **brand app** after human login
- `https://naano.com/llms.txt`, `pricing.md`
- Capture already green: `CAPTURE-TEST.md`, `.agent-logs/`

## Likely root objects (for rebuild)

1. **User** + **role** (creator | brand)  
2. **CreatorProfile / MarketplaceCard** (niche, rate €/post, stats, public deal link)  
3. **Campaign / Brief** (brand objectives, guidelines, tracking)  
4. **Opportunity / Application** (creator discovers or is invited; status tabs)  
5. **Collaboration** (status machine: brief → draft → live → paid; due dates; net)  
6. **Message** (thread per collab)  
7. **EarningsLedger / Payout** (Stripe Connect, withdraw, invoices)  
8. **AttributionEvent** (click/lead/pipeline per post) — brand-side priority  

## Important constraints

- Ship **live + public**; stranger must open the link without our session  
- Commit `.agent-logs/` interleaved with work  
- `/swe`: no implementation until plan approval  
- Real LinkedIn OAuth / Apify / Stripe can be stubbed for MVP; mirror the **jobs**  
- Creator paid-campaign gate at 1k followers is a product rule we may simplify or keep  

## Unknowns

- [x] Brand authenticated IA — **done** (`/brand`, sidebar, campaigns, AI matching, marketplace)
- [ ] Exact collaboration status enum and transitions (both sides)
- [ ] Full booking click-path on a live collab (invite → accept → draft → publish → pay)
- [ ] Full meaning of creator deal-link **25% share / 3-month reward**
- [ ] Attribution / Pixel Naano implementation details
- [ ] Agency workspace depth (skip for MVP)

## Affected areas (our rebuild surface)

- Marketing + role-based auth  
- Creator: card, opportunities, collaborations, earnings (can mock Stripe)  
- Brand: overview, creators (marketplace + simple match), campaigns/briefs, collaborations, results (simple), billing wallet (mock)  
- Shared: messaging-lite or status-only at first  
- **Cut for MVP:** Agency mode, MCP/Pixel, full AI matching agent, community/leaderboard

## Possible approaches (planning, not locked)

### Solution A — Thin two-sided marketplace (recommended)

Ship both roles with one happy path: card ↔ brief ↔ book ↔ status ↔ mock pay/track.

- **+** Matches how Naano sells itself; best demo story  
- **−** More surface area than one-sided  

### Solution B — Brand-first

Excellent brand campaign UX; creator is a thin profile + accept.

- **+** Faster brand wow  
- **−** Weak marketplace story  

### Solution C — Creator-first

Excellent studio (card, opportunities, earnings); brand is minimal.

- **+** We already understand this side deeply  
- **−** Judges may miss the buyer loop  

## Recommendation

**A (thin two-sided)** — we now have enough IA from **both** `/creator` and `/brand` to plan without more login sessions. Stub Stripe/LinkedIn/AI/Pixel; keep card ↔ campaign ↔ collaboration status real.

## Why

Both shells are SPA hash-routers under `/creator` and `/brand`. Brand is campaign- and matching-centric; creator is card- and opportunity-centric. The shared object is the **collaboration** between a campaign and a creator profile.

## What I still need from you

1. Lock planning decisions **D001–D003** (MVP shape / stack / parity)  
2. Optional later: one real booking if you ever have a live collab — not blocking to start plan  

## Evidence index

| Claim | Source |
|---|---|
| Creator app at `/creator` | Auth session URL + title “Creator studio” |
| Brand app at `/brand` | Auth session URL + title “Multi-network creator platform” |
| Brand sidebar Overview→Billing | `00-home-after-login` screenshot |
| AI Matching + Marketplace tabs | Brand screenshot + JSON |
| Campaigns All/Active/Draft/Completed | `01-_brand_campaigns` bodySnippet |
| Launch: team / AI / link | Brand headings + buttons |
| Wallet €0 + Add budget | Brand header / billing headings |
| Team members path | `/brand/settings/members` |
| Many guessed routes 404 | Both crawl logs |

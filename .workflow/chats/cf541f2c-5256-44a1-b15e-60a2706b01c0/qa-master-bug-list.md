# QA Master Bug List — Naano

## Executive verdict (1 short paragraph: ship readiness)

**Not demo-ready without a short P0/P1 pass.** Core brand↔creator collaboration happy path (invite → accept → deliverable → approve → mark-paid) works and is well defended, but shipping blockers remain: unauthenticated `/ai/chat` (quota/abuse), `javascript:` URL XSS on website/draft links, YouTube soft-fail corrupting creator profiles, wallet top-up Int overflow 500s, draft-campaign invites that escrow money, and a advertised Deal Link (`/c/:slug`) that dumps to marketing home. Platform story (LinkedIn marketed vs YouTube onboarding) plus mutated demo data (“Bill Gates” / 41M) will break trust in a live walkthrough. Intentional stubs (Affiliate, Analytics, OAuth, wallet top-ups, payouts) are fine where labeled. **Product audit file (`/tmp/qa-product.md`) contains only the agent prompt — no Product findings; this list consolidates API + Bug + UX + UI against specs.**

## Severity legend (P0 blocker / P1 high / P2 medium / P3 low)

| Level | Meaning |
|-------|---------|
| **P0** | Ship blocker: security/abuse or data corruption that should not go public |
| **P1** | High: broken core demo path, XSS, money/state integrity, or trust-breaking product failure |
| **P2** | Medium: incomplete/misleading UX, major mobile chrome, or important incomplete wiring |
| **P3** | Low: polish, status-code hygiene, visual inconsistency, mild copy/IA |

## Master prioritized bugs

### P0-01 Unauthenticated `POST /ai/chat` burns LLM quota
- **Sources:** API, Bug
- **Classification:** SECURITY
- **Evidence:** `curl` without cookie → **200 SSE** deltas; `backend/src/routes/ai.ts` has no `requireUser`; brand/creator routes correctly 401.
- **Repro:** `POST /api/v1/ai/chat` with `{"messages":[{"role":"user","content":"hi"}]}` and no session.
- **Suggested fix direction:** Require session (any logged-in user); optionally rate-limit; refuse anonymous even in dev.
- **False-positive notes:** Spec makes `/guide` public by design; that does **not** justify leaving the streaming chat proxy open.

### P0-02 `javascript:` URLs stored and rendered as clickable hrefs (XSS)
- **Sources:** Bug (API noted unsanitized brand `company` / HTML strings; Bug confirmed active XSS path)
- **Classification:** SECURITY
- **Evidence:** `PATCH /brand/me` `website: "javascript:alert(1)"` → 200; deliverable `draftUrl` with `javascript:` → 200 (`z.string().url()`). FE: `BrandCollaborations.tsx` `href={draftUrl}`; `OnboardingCompanySummaryPage.tsx` `href={profile.website}`; latent `AIMessage.tsx` markdown `a href={href}`.
- **Repro:** Set brand website or submit draft URL to `javascript:alert(1)`, click the link in UI.
- **Suggested fix direction:** Restrict URL fields (and markdown hrefs) to `http:`/`https:` via Zod refine + FE guard; reject other schemes.
- **False-positive notes:** React text-node escaping of `<script>` / `<img>` in titles mitigates *display* XSS but does **not** cover `href={javascript:…}`.

### P1-01 YouTube soft-fail overwrites display name, keeps old followers
- **Sources:** API, Bug (UX saw resulting demo corruption)
- **Classification:** BROKEN
- **Evidence:** Nonexistent channel → 200 `partial:true`; name → stub handle; followers unchanged (e.g. stayed 18400 or prior inflated). `creator.service.ts`: `if (!partial || analysis.followers > 0 || analysis.name)` — stub name is truthy. LinkedIn partial path is safer.
- **Repro:** Authenticated creator `POST /creator/onboarding/youtube` with a 404/nonexistent handle.
- **Suggested fix direction:** On completed profiles with `partial`, update URL only (match LinkedIn); never overwrite name/followers on soft-fail.
- **False-positive notes:** Successful LinkedIn overwrite to “Bill Gates” during audit is destructive re-analyze behavior, not the same bug; demo residue is largely this soft-fail + live analyze writes.

### P1-02 Wallet top-up huge `amountCents` → 500 (Prisma Int overflow)
- **Sources:** API, Bug
- **Classification:** BROKEN
- **Evidence:** `999999999999` / near-Int32 edges → **500** with Prisma stack in body; `topupSchema` only `.positive()`; `walletBalanceCents Int`.
- **Repro:** Brand session `POST /brand/wallet/topup` with oversized `amountCents`.
- **Suggested fix direction:** Cap amount so `balance + amount ≤ Int32` (or BigInt); return **400**, never 500.
- **False-positive notes:** Stub top-ups are intentional; unlabeled 500 / stack leak is not.

### P1-03 Invite allowed on `draft` campaigns (escrows funds)
- **Sources:** API, Bug
- **Classification:** BROKEN
- **Evidence:** Invite to draft campaign → 200, wallet decremented, collab `invited`. `brand.service.invite` never checks `campaign.status`. Marketplace defaults `selectedCampaignId` to `campaigns[0]` (often draft) and lists drafts.
- **Repro:** Create/select draft campaign → Book/invite creator from marketplace.
- **Suggested fix direction:** Reject invite unless `status === "active"`; marketplace select/default only active campaigns.
- **False-positive notes:** None — both agents confirmed live.

### P1-04 Deal Link `/c/:slug` is a dead route → marketing home
- **Sources:** Bug, UX
- **Classification:** BROKEN
- **Evidence:** Storefront/Overview advertise `${origin}/c/${cardSlug}`; `App.tsx` has no `/c/:…`; `path="*"` → `<Navigate to="/" />`.
- **Repro:** Copy Deal Link from creator Overview/Storefront; open in browser.
- **Suggested fix direction:** Add public `/c/:cardSlug` card page, or stop advertising/copying that URL until it exists.
- **False-positive notes:** Not a blank-screen crash; product failure via catch-all redirect.

### P1-05 LinkedIn marketed / YouTube required — incoherent platform story
- **Sources:** UX (specs: master/marketing say LinkedIn; onboarding asks YouTube)
- **Classification:** INCOMPLETE
- **Evidence:** `/` and `/creators` promise LinkedIn; `/onboarding/creator/youtube` required; Industries/Overview/Analytics still say “LinkedIn”; `/onboarding/creator/linkedin` redirects to YouTube.
- **Repro:** Walk register → creator onboarding → Overview metrics after YouTube import.
- **Suggested fix direction:** Pick one platform for MVP copy + import + metrics (or clearly dual-label); align marketing, steps, and cards.
- **False-positive notes:** Not a runtime crash; still a **demo trust** ship issue per UX. Specs still define LinkedIn product — YouTube path is the accidental drift.

### P1-06 `/onboarding/role` signup paths broken
- **Sources:** UX
- **Classification:** BROKEN
- **Evidence:** “Business” → `/register?role=brand` but Register only maps `saas`/`influencer` → role ignored. “Creator” → `/onboarding/creator/youtube` without account → `RequireRole` → `/login`, not register.
- **Repro:** Open `/onboarding/role` and follow each CTA as a logged-out user.
- **Suggested fix direction:** Map `brand`→`saas` (and creator→register with `influencer`); never send unauthenticated users into gated onboarding.
- **False-positive notes:** Email register with `?role=saas|influencer` from marketing CTAs works — only this role page / `brand` param is broken.

### P2-01 GuideBar (S09) never mounted — advertised help path missing
- **Sources:** UX (specs S09 / shell call for GuideBar)
- **Classification:** INCOMPLETE
- **Evidence:** `GuideBar` exists; not in `App.tsx`; only `GuidePointer` + Nao FAB. Spec exit: typed question → tour pointer.
- **Repro:** Look for guide ask UI in app shells — absent.
- **Suggested fix direction:** Mount GuideBar (or remove S09 claims / pointer-only dead code).
- **False-positive notes:** Nao AI chat is a separate surface; it does not satisfy the guide-bar tour contract.

### P2-02 `/brand/results` silently redirects to Billing
- **Sources:** UX (S08 wanted a Results stub page)
- **Classification:** INCOMPLETE
- **Evidence:** `App.tsx` Results → `Navigate` to `/brand/billing`; `BrandResults` unused; Messages copy still mentions “results”.
- **Repro:** Hit `/brand/results` or follow any “results” reference.
- **Suggested fix direction:** Restore labeled Results stub **or** purge “results” from nav/copy/AI context.
- **False-positive notes:** Not “working billing” — accidental removal of the S08 stub.

### P2-03 Messages IA implies human inbox; only Nao AI
- **Sources:** UX (S17 Messages stub; master: real-time messaging out of scope)
- **Classification:** UX
- **Evidence:** Nav label “Messages”; page is AI-only (“Chat with Nao”); duplicate of floating Nao + Settings “Open Nao”.
- **Repro:** Open `/creator/messages` or `/brand/messages`.
- **Suggested fix direction:** Rename nav/page to “Nao” / “AI assistant”, or add clear “AI-only — no human inbox” empty-state chrome.
- **False-positive notes:** Building real messaging is **out of scope**; unlabeled/misleading IA is the bug.

### P2-04 Mobile: Nao FAB occludes Messages composer
- **Sources:** UI
- **Classification:** VISUAL / UX
- **Evidence:** Screenshots `creator_messages__390`, brand messages @390; `AIAssistant` `z-[60]` over send control.
- **Repro:** Open Messages at ~390px width.
- **Suggested fix direction:** Hide global FAB on `*/messages` (or relocate); reserve bottom padding.
- **False-positive notes:** None.

### P2-05 Mobile: collaboration tables clip; fixed 64px rail
- **Sources:** UI
- **Classification:** VISUAL / UX
- **Evidence:** Creator/Brand collab tables `min-w-[40rem]` clip STATUS/columns @390; shells keep permanent `w-16` spacer; hover-expand only (no tap).
- **Repro:** `/creator/collaborations` and `/brand/collaborations` at 390; any app shell ≤768.
- **Suggested fix direction:** Stacked card/list rows below `md`; collapse rail to drawer/bottom nav on small screens.
- **False-positive notes:** Horizontal scroll alone is insufficient (STATUS still clipped in screenshots).

### P2-06 `DealLinkCard` defaults `dataPending=true` → false “Pending”
- **Sources:** Bug, UX
- **Classification:** BROKEN
- **Evidence:** `DealLinkCard.tsx` default `true`; Overview / Industries / Rate omit prop → Pending + 18% bar despite followers. Storefront passes prop correctly.
- **Repro:** View Deal Link card on Creator Overview with followers set.
- **Suggested fix direction:** Default `false` or require explicit prop; pass `dataPending={!followers}` everywhere.
- **False-positive notes:** None.

### P2-07 Marketplace “My creators” tab does nothing
- **Sources:** UX
- **Classification:** PARTIAL
- **Evidence:** Tab `"mine"` never filtered (only `saved` is).
- **Repro:** Brand Marketplace → “My creators”.
- **Suggested fix direction:** Filter to booked/invited creators, or hide/disable the tab until wired.
- **False-positive notes:** None.

### P2-08 Currency story: `$` vs `€` / naming vs spec
- **Sources:** UX, UI
- **Classification:** UX
- **Evidence:** Spec: euro cents everywhere. Creator UI uses `$` (`formatUsdFromCents`); brand path uses `formatEuroFromCents` that UI audit says still formats **USD**/`$`. Same marketplace rates, split symbols.
- **Repro:** Compare creator rate/earnings display vs brand marketplace/billing.
- **Suggested fix direction:** One currency symbol and formatter name aligned with locked euro-cents convention (or explicitly document USD seed and rename helpers).
- **False-positive notes:** UI “formats USD” vs UX “brand €” may reflect different screens/helpers — treat as **inconsistency to unify**, not two separate bugs.

### P2-09 Primary CTA language split (`.btn-navy` vs `.btn-ink`) + campaign-new hierarchy
- **Sources:** UI
- **Classification:** VISUAL
- **Evidence:** Campaign AI/from-link/onboarding + brand settings use `.btn-ink`; marketplace/home use `.btn-navy`. `BrandCampaignNew` mixes h-10 primary with h-8 ghost on equal cards.
- **Repro:** Compare Book/Save on marketplace vs Launch on campaign AI vs three cards on `/brand/campaigns/new`.
- **Suggested fix direction:** One primary button recipe; equal CTA sizes + `mt-auto` on campaign-new cards.
- **False-positive notes:** Pure visual; not functional.

### P2-10 Creator onboarding step labels jump / LinkedIn leftover copy
- **Sources:** UX
- **Classification:** UX
- **Evidence:** Steps “1 → 3 → 4”, Terms unlabeled; Industries “public LinkedIn profile” after YouTube step.
- **Repro:** Walk `/onboarding/creator/*`.
- **Suggested fix direction:** Renumber 1–N continuously; fix leftover LinkedIn copy (ties to P1-05).
- **False-positive notes:** Partial overlap with P1-05 — keep as onboarding-chrome fix once platform decided.

### P3-01 Missing campaign on invite returns 409 not 404
- **Sources:** API
- **Classification:** PARTIAL
- **Evidence:** Missing campaign → **409** `Campaign not found or not owned` (message implies 404).
- **Repro:** `POST /brand/campaigns/:badId/invite` with valid creator.
- **Suggested fix direction:** Map not-found/not-owned to **404**.
- **False-positive notes:** None.

### P3-02 HTML-looking names/titles accepted (escaped, still polluting)
- **Sources:** Bug, API
- **Classification:** UX / SECURITY (low)
- **Evidence:** Campaign title `<img…>` and script-like creator names stored; React text escapes classic XSS; option labels ugly. Brand `company` XSS payload already in DB.
- **Repro:** Create campaign with HTML title; view lists/selects.
- **Suggested fix direction:** Max length + reject/strip angle brackets on display names/titles if desired.
- **False-positive notes:** Not confirmed executable XSS via text nodes; do not conflate with P0-02.

### P3-03 Marketing / pricing mobile polish + shell chrome drift
- **Sources:** UI
- **Classification:** VISUAL
- **Evidence:** Dual hero CTAs cramped @390; pricing `min-w-[40rem]` truncates; company onboarding bypasses `OnboardingShell`; PageHeader inconsistently adopted.
- **Repro:** `/`, `/pricing` @390; company onboarding screens.
- **Suggested fix direction:** Stack CTAs; card/stacked plans; reuse `OnboardingShell` / `PageHeader`.
- **False-positive notes:** Bundle of nits — fix only if polishing for screenshots.

### P3-04 Mild copy/IA dead ends (confirm, empty states, badges)
- **Sources:** UX
- **Classification:** UX
- **Evidence:** Mark paid / Decline no confirm; Billing empty “No invoices yet”; Overview Copy no toast; Opportunities “Assigned”==“Open briefs”; Collabs tab “Applications sent” = brand invites; Community Slack → slack.com; EN/FR no-op; `1/3` badge; campaign rows non-drillable.
- **Repro:** Exercise listed flows.
- **Suggested fix direction:** Batch copy/confirm/feedback fixes in one polish pass; leave non-critical stubs alone.
- **False-positive notes:** Several are acceptable assignment polish; not ship blockers.

## Intentional stubs (do not fix as bugs)

| Stub | Spec / labeling | Notes |
|------|-----------------|-------|
| Affiliate | S17 — “Not implemented yet” | OK |
| Analytics | S17 — static / import placeholder | OK (LinkedIn wording is part of P1-05, not “build analytics”) |
| OAuth buttons | S05 — “coming soon” | OK |
| Forgot password | Disabled / coming soon | OK |
| Wallet top-ups | Labeled “Stub top-ups — no real card charge” | OK **except** P1-02 overflow 500 |
| Creator payouts / Stripe | Disabled + “Payouts are stubbed” | OK |
| Campaign onboarding calendar | “no real invite is sent” | OK |
| Real-time human messaging | Master non-goals; S17 Messages stub | OK to remain AI-only **if** labeled (see P2-03) |
| Leads & Analytics nav Beta | Non-clickable “Coming soon” | OK |
| `/creator/card` → storefront | Intentional alias | OK |
| `POST /brand/campaigns` raw create | Backend orphan; FE uses draft flows | Not a user-facing bug |
| `/guide` public | S09 design | OK; do not confuse with P0-01 `/ai/chat` |
| EN/FR toggle no-op | Cosmetic | P3 at most |

## Contradictions resolved

1. **Product report missing:** `/tmp/qa-product.md` is only the auditor prompt (43 lines). No Product classifications to cite; functional claims taken from API/Bug/UX + specs.
2. **`from-link` soft 200:** API marked FAIL for garbage URL → 200 `partial`; also noted intentional for FE. **Dropped as master bug** (weak validation at most); keep soft-fail UX unless Phase 3 wants stricter 400.
3. **Currency € vs $:** Spec locks euro cents; FE shows mixed `$` and euro-named helpers. Unified as **P2-08**, not two bugs.
4. **Messages “broken” vs stub:** Spec stubs messaging; **not** “implement inbox.” Master issue is **misleading labeling** (P2-03).
5. **Results:** S08 required a Results stub; silent Billing redirect is an **accident**, not an intentional stub (P2-02).
6. **Guide vs Nao:** S09 GuideBar ≠ floating Nao chat. Unmounted GuideBar is incomplete (P2-01); public `/guide` API alone does not close the gap.
7. **XSS:** Escaped HTML in titles ≠ `javascript:` href XSS. Former P3-02; latter P0-02.
8. **Invite severity:** API “critical” + Bug P2 → consolidated **P1-03** (money escrow on draft is integrity, not polish).
9. **UI “Critical” mobile:** Elevated for demo on phone, but not auth/data P0 → **P2-04/05**.
10. **LinkedIn analyze → Bill Gates:** Audit side-effect of live write APIs + soft-fail; primary code bug is P1-01; hygiene = re-seed.

## Recommended fix order for Phase 3 (numbered batches)

1. **Security & money integrity:** P0-01 auth on `/ai/chat`; P0-02 http(s)-only URLs (website, draftUrl, AI markdown); P1-02 top-up max → 400; P1-03 reject draft invites + marketplace active-only default.
2. **Demo-breaking product:** P1-01 YouTube soft-fail; P1-04 Deal Link route or stop advertising; P1-05 platform copy decision; P1-06 onboarding/role + `?role=brand`; **re-seed** after profile/wallet mutations.
3. **Incomplete wiring / IA:** P2-01 GuideBar mount or remove; P2-02 Results stub vs purge; P2-03 rename/label Messages; P2-06 `dataPending`; P2-07 My creators tab.
4. **Mobile & visual ship polish:** P2-04 FAB vs composer; P2-05 tables + rail; P2-09 CTA unification; P2-08 currency unify.
5. **Hygiene / polish (timeboxed):** P2-10 step labels; P3-01 status codes; P3-02 HTML names; P3-03 marketing mobile; P3-04 copy/confirms.

## Demo hygiene (re-seed etc.)

- **Re-seed before any demo.** Audits mutated: Amélie → Bill Gates / Google / ~41M (YouTube/LinkedIn analyze); brand wallet (topups + escrow); extra campaigns/collabs; draft invites; deliverable/XSS campaign titles; brand `website` / `company` XSS strings.
- After fixing P1-01, avoid re-running onboarding analyze on demo accounts without re-seed.
- Prefer “Demo as creator / brand” only on a fresh seed so Overview/Storefront show Amélie, not audit residue.
- Clear leftover cookie jars / test users created by DELETE-account tests if any remain.
- Screenshot/mobile QA after batch 4 if phone demo matters; otherwise desktop happy path after batches 1–2 is enough for assignment ship.

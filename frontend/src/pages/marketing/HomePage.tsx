import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Icon } from "../../components/ui/Icon";

const CAPABILITIES = [
  {
    icon: Users,
    title: "Discover creators",
    body: "Browse fit-first profiles with reach, rate, and match scores — the same marketplace brands use inside the app.",
  },
  {
    icon: Megaphone,
    title: "Launch campaigns",
    body: "AI brief, calendar onboarding, or recover from an existing link. Every path lands in one editable campaign.",
  },
  {
    icon: Briefcase,
    title: "Run collaborations",
    body: "Invite, approve drafts, go live, and pay from a single pipeline with clear status at every step.",
  },
  {
    icon: Target,
    title: "Track outcomes",
    body: "Connect posts to views, clicks, and wallet activity so every creator booking has a paper trail.",
  },
] as const;

const STEPS = [
  { n: "01", title: "Create a campaign", body: "Brief, ICP, claim, and destination URL in minutes." },
  { n: "02", title: "Book creators", body: "Filter by fit, save shortlists, book into escrow." },
  { n: "03", title: "Collaborate", body: "Creators accept, submit drafts, and publish." },
  { n: "04", title: "Measure & pay", body: "Approve live work and settle from your wallet." },
] as const;

function ProductPreview() {
  return (
    <div className="landing-preview relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="card-surface relative z-10 overflow-hidden shadow-[var(--shadow-lg)]"
        aria-hidden
      >
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="brand-mark h-7 w-7 text-[10px]">n</span>
            <span className="text-sm font-semibold text-ink">Creators</span>
          </div>
          <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted">
            Match · 86
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {[
            { name: "Amélie Dubois", niche: "DevOps · Platform", rate: "$185", match: "91" },
            { name: "Raj Patel", niche: "PLG · SaaS growth", rate: "$140", match: "84" },
          ].map((c) => (
            <div
              key={c.name}
              className="flex flex-col rounded-[var(--radius)] border border-border bg-surface p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">Match {c.match}</span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                  Live
                </span>
              </div>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground">
                {c.name.slice(0, 1)}
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">{c.name}</p>
              <p className="mt-0.5 text-[11px] text-muted">{c.niche}</p>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-2.5">
                <span className="text-sm font-semibold text-ink">{c.rate}</span>
                <span className="btn-navy btn-sm pointer-events-none h-7 px-3 text-[11px]">
                  Book
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border bg-surface-secondary px-4 py-3">
          <div className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-3 py-2.5">
            <Icon icon={Sparkles} size="sm" className="text-accent" />
            <p className="min-w-0 flex-1 truncate text-xs text-muted">
              Ask Nao to draft a campaign brief…
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-white">
              <Icon icon={ArrowRight} size="sm" />
            </span>
          </div>
        </div>
      </div>

      <div
        className="landing-preview-float absolute -bottom-4 -left-3 z-20 hidden w-[min(100%,14rem)] sm:block"
        aria-hidden
      >
        <div className="card-surface p-3 shadow-[var(--shadow-md)]">
          <div className="flex items-center gap-2">
            <Icon icon={Megaphone} size="sm" className="text-accent" />
            <p className="text-xs font-semibold text-ink">Campaign live</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            PLG creators · 3 posts booked · wallet escrowed
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-2/3 rounded-full bg-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowPreview() {
  return (
    <div className="card-surface overflow-hidden shadow-[var(--shadow-md)]" aria-hidden>
      <div className="flex border-b border-border bg-surface-secondary text-[11px] font-semibold text-muted">
        {[
          { icon: LayoutGrid, label: "Overview" },
          { icon: Users, label: "Creators", active: true },
          { icon: Briefcase, label: "Collabs" },
          { icon: MessageSquare, label: "Messages" },
        ].map((tab) => (
          <div
            key={tab.label}
            className={[
              "flex flex-1 items-center justify-center gap-1.5 px-2 py-3",
              tab.active ? "bg-surface text-ink" : "",
            ].join(" ")}
          >
            <Icon icon={tab.icon} size="sm" />
            <span className="hidden sm:inline">{tab.label}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2 p-4">
        {[
          { brand: "RunAnywhere", status: "Draft submitted", tone: "warning" },
          { brand: "Northwind", status: "Live", tone: "success" },
          { brand: "Atlas Pay", status: "Invited", tone: "accent" },
        ].map((row) => (
          <div
            key={row.brand}
            className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{row.brand}</p>
              <p className="text-[11px] text-muted">Creator post · 1 of 3</p>
            </div>
            <span
              className={[
                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                row.tone === "success"
                  ? "bg-success-soft text-success ring-success/30"
                  : row.tone === "warning"
                    ? "bg-warning-soft text-warning ring-warning/30"
                    : "bg-accent-soft text-accent ring-accent/25",
              ].join(" ")}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="landing-reveal relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted shadow-[0_1px_0_rgba(17,19,24,0.02)]">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              B2B creator marketplace
            </p>
            <h1 className="text-heading mt-5 max-w-xl text-[2rem] font-semibold tracking-tight text-ink sm:text-5xl sm:leading-[1.08]">
              Find creators your buyers already trust.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[color:var(--copy)] sm:text-lg">
              Naano helps B2B teams discover fit-first creators, launch
              campaigns, run collaborations, and track results — from one
              workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register?role=saas" className="btn-navy">
                Launch a campaign
                <Icon icon={ArrowRight} size="sm" />
              </Link>
              <a href="#product" className="btn-ghost">
                See the product
              </a>
            </div>
            <p className="mt-4 text-xs text-muted">
              Free self-serve · Wallet escrow · Creator marketplace
            </p>
          </div>

          <div className="landing-reveal-delay relative min-w-0 pb-6 sm:pb-8">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-y border-border bg-surface/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Built for brand teams
          </p>
          <h2 className="text-heading mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Everything you already do in the app — from discovery to payout.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <article
                key={item.title}
                className="card-surface flex flex-col p-5 transition-colors hover:border-ink/15"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon icon={item.icon} size="sm" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Product showcase */}
      <section id="product" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Product
            </p>
            <h2 className="text-heading mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              The same UI your team uses after signup.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Icon-rail navigation, match scores, status badges, wallet escrow,
              and Nao — designed as one system, not a brochure bolted onto a
              dashboard.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {[
                "Marketplace booking into an existing campaign brief",
                "Collaboration statuses from invite to paid",
                "Messages with Nao for campaign questions",
              ].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="text-muted">{line}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="btn-ghost mt-8 inline-flex"
            >
              Create an account
              <Icon icon={ArrowRight} size="sm" />
            </Link>
          </div>
          <WorkflowPreview />
        </div>
      </section>

      {/* AI */}
      <section className="border-y border-border bg-beige/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                <Icon icon={Sparkles} size="sm" />
                Nao
              </p>
              <h2 className="text-heading mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                An assistant that knows the product.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Nao lives in the app — draft campaign briefs, ask about
                collaborations, or get pointed to the right screen. Same accent,
                same controls, no separate “AI product” aesthetic.
              </p>
            </div>
            <div className="card-surface overflow-hidden p-0 shadow-[var(--shadow-md)]">
              <div className="border-b border-border bg-surface-secondary px-4 py-3">
                <p className="text-sm font-semibold text-ink">Nao</p>
                <p className="text-xs text-muted">
                  Ask about campaigns, creators, billing…
                </p>
              </div>
              <div className="space-y-3 p-4">
                <div className="ml-auto max-w-[85%] rounded-[var(--radius-panel)] bg-accent px-3.5 py-2.5 text-sm text-white">
                  Draft a PLG campaign for our EU launch.
                </div>
                <div className="max-w-[92%] rounded-[var(--radius-panel)] border border-border bg-surface-secondary px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                  Here’s a brief: title, destination URL, ICP, one claim, and
                  must-nots. Open{" "}
                  <span className="font-semibold">Campaigns → Create with AI</span>{" "}
                  to edit and publish.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Workflow
          </p>
          <h2 className="text-heading mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            From brief to live post in four steps.
          </h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n} className="card-surface p-5">
                <span className="text-[11px] font-bold tracking-wide text-accent">
                  {step.n}
                </span>
                <h3 className="mt-3 text-base font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border bg-[color:var(--footer)] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Your next creator campaign starts here.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/65 sm:text-base">
            Sign up as a brand to open the marketplace, or join as a creator and
            publish your rate card.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/register?role=saas"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-pill)] bg-white px-5 text-sm font-semibold text-ink transition hover:bg-white/90"
            >
              Start for free
            </Link>
            <Link
              to="/creators"
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius-pill)] border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              For creators
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import { Link } from "react-router-dom";

const BENEFITS = [
  {
    title: "Centralized opportunities",
    body: "Discover brand deals that match your audience—or bring your own onto the platform.",
  },
  {
    title: "Payments built-in",
    body: "Get paid within 24h via Stripe. No invoices, no chasing brands.",
  },
  {
    title: "Track performance",
    body: "See views, clicks, and engagement for every sponsored post.",
  },
  {
    title: "Keep creative control",
    body: "Post in your own voice. Free to join, no exclusivity contracts.",
  },
] as const;

export function CreatorsPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          2,000+ creators paid · 4.8/5 rating
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          Get paid to post on LinkedIn
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Choose deals from B2B brands you know, post in your own voice, and get
          paid within 24h. No negotiating, no admin. Creators earn €500 on
          average per deal.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register?role=influencer" className="btn-navy">
            Start earning
          </Link>
          <a href="#benefits" className="btn-ghost">
            See how it works
          </a>
        </div>
        <p className="mt-4 text-sm text-muted">
          Free to join · No exclusivity · Paid within 24h
        </p>
      </section>

      <section
        id="benefits"
        className="scroll-mt-20 border-y border-sky-deep/40 bg-surface/40 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Monetize your content on Naano.
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            For creators who don&apos;t want the administrative burden. Find
            deals, get paid, and track performance from one dashboard.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-sky-deep/60 bg-surface/80 px-5 py-6"
              >
                <h3 className="text-base font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Example rate card
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          You set a fixed fee per post. Brands book at your published rate—no
          back-and-forth negotiation.
        </p>
        <div className="mt-8 max-w-md rounded-2xl border border-sky-deep/60 bg-surface/90 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-ink">Robin Tempe</p>
              <p className="mt-1 text-sm text-muted">B2B SaaS · Product</p>
            </div>
            <span className="rounded-md bg-sky px-2 py-1 text-xs font-semibold text-navy">
              LinkedIn
            </span>
          </div>
          <div className="mt-6 flex items-end justify-between border-t border-sky-deep/50 pt-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Starting rate
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ink">€800</p>
            </div>
            <p className="pb-1 text-sm font-medium text-muted">/ post</p>
          </div>
        </div>
      </section>

      <section className="border-t border-sky-deep/40 bg-surface/50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-4xl">
            You&apos;ve seen how it works. Now get paid for it.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            Join thousands of B2B creators earning on LinkedIn with Naano.
          </p>
          <Link
            to="/register?role=influencer"
            className="btn-navy mt-8 inline-flex"
          >
            Start earning
          </Link>
        </div>
      </section>
    </>
  );
}

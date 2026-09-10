import { Link } from "react-router-dom";

const ROWS = [
  {
    label: "Price",
    selfServe: "€0 / month",
    managed: "€700 / month",
  },
  {
    label: "What's included",
    selfServe:
      "Creator marketplace access, AI-powered brief creation, click/lead/pipeline tracking, automatic creator payouts",
    managed:
      "Campaign strategy & positioning, creator sourcing & coordination, brief creation & launch, reporting & optimisation",
  },
  {
    label: "Creator payment",
    selfServe: "You book the creator's published fixed-price offer",
    managed: "Naano manages creator payments on your behalf",
  },
  {
    label: "Support",
    selfServe: "Self-serve platform, help center + email",
    managed: "Dedicated Naano team, book a campaign call",
  },
] as const;

export function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Pricing
      </p>
      <h1
        data-tour-id="marketing-pricing"
        className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
      >
        Naano pricing
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
        Naano offers two ways to run LinkedIn creator campaigns. Self-Serve
        costs €0 per month with full platform access. Managed Campaigns costs
        €700 per month and adds a Naano team that sources creators, writes
        briefs and runs your campaigns end to end.
      </p>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-sky-deep/60 bg-surface/90">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-sky-deep/50 bg-sky/60">
              <th className="px-4 py-4 font-semibold text-muted sm:px-6" />
              <th className="px-4 py-4 font-extrabold text-ink sm:px-6">
                Self-Serve
              </th>
              <th className="px-4 py-4 font-extrabold text-ink sm:px-6">
                Managed Campaigns
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.label}
                className="border-b border-sky-deep/40 align-top last:border-b-0"
              >
                <th className="px-4 py-4 font-semibold text-ink sm:px-6">
                  {row.label}
                </th>
                <td className="px-4 py-4 text-muted sm:px-6">{row.selfServe}</td>
                <td className="px-4 py-4 text-muted sm:px-6">{row.managed}</td>
              </tr>
            ))}
            <tr>
              <th className="px-4 py-5 sm:px-6" />
              <td className="px-4 py-5 sm:px-6">
                <Link to="/register?role=saas" className="btn-navy text-sm">
                  Start for free
                </Link>
              </td>
              <td className="px-4 py-5 sm:px-6">
                <Link to="/register?role=saas" className="btn-ghost text-sm">
                  Get started
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-2xl text-sm text-muted">
        Campaign spend is separate from the plan fee. No lock-in, cancel
        anytime. Marketplace offers use a fixed price chosen by the creator—there
        is no cost per click, impression, or lead.
      </p>
    </section>
  );
}

import { formatEuroFromCents } from "./money";

export function CreatorEarnings() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Earnings
      </h1>
      <p className="mt-2 text-sm text-muted">
        Track your balance and payouts.
      </p>

      <div className="mt-8 max-w-md rounded-xl border border-sky-deep/50 bg-surface/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Available balance
        </p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
          {formatEuroFromCents(0)}
        </p>

        <button
          type="button"
          disabled
          className="btn-navy mt-6 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          title="Coming soon"
        >
          Connect Stripe
        </button>

        <p className="mt-4 text-sm text-muted">
          Payouts stub — Stripe later.
        </p>
      </div>
    </div>
  );
}

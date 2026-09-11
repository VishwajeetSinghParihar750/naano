import { useEffect, useState } from "react";
import { ApiError, api } from "../../lib/api";
import { formatUsdFromCents } from "./money";
import { PageError, PageHeader, PageLoading } from "./ui";
import type { CreatorEarnings, CreatorEarningsResponse } from "./types";

export function CreatorEarnings() {
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<CreatorEarningsResponse>("/creator/earnings")
      .then((data) => setEarnings(data.earnings))
      .catch((err: unknown) =>
        setError(
          err instanceof ApiError ? err.message : "Could not load earnings.",
        ),
      );
  }, []);

  if (error) return <PageError message={error} />;
  if (!earnings) return <PageLoading label="Loading earnings…" />;

  const maxBar = Math.max(1, ...earnings.overTime.map((b) => b.cents));

  return (
    <div>
      <PageHeader
        title="Earnings"
        subtitle="Track what you've earned and what's still in transit."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Total earned
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatUsdFromCents(earnings.totalEarnedCents)}
          </p>
        </div>
        <div className="card-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            In transit
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatUsdFromCents(earnings.inTransitCents)}
          </p>
        </div>
        <div className="card-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Available now
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatUsdFromCents(earnings.availableNowCents)}
          </p>
        </div>
      </div>

      <section className="card-surface mt-6 p-5">
        <h2 className="text-lg font-semibold">Earnings over time</h2>
        <div className="mt-6 flex h-40 items-end gap-3">
          {earnings.overTime.map((b) => (
            <div key={b.month} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-ink/90"
                style={{
                  height: `${Math.max(4, (b.cents / maxBar) * 100)}%`,
                }}
                title={formatUsdFromCents(b.cents)}
              />
              <span className="text-xs text-muted">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface mt-6 p-5">
        <h2 className="text-lg font-semibold">Withdraw earnings</h2>
        <p className="mt-1 text-sm text-muted">
          Bank transfer or Stripe. Payouts are stubbed in this build.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-ghost btn-sm" disabled>
            Bank transfer
          </button>
          <button type="button" className="btn-navy btn-sm" disabled>
            {earnings.stripeConnected ? "Withdraw via Stripe" : "Stripe not connected"}
          </button>
        </div>
      </section>

      <section className="card-surface mt-6 p-5">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {earnings.recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No earnings activity yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {earnings.recent.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{r.brand}</p>
                  <p className="text-xs text-muted">
                    {r.campaign} · {r.status}
                  </p>
                </div>
                <span className="font-semibold">
                  {formatUsdFromCents(r.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

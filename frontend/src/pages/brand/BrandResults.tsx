import { useEffect, useState } from "react";
import { ApiError, api } from "../../lib/api";
import { formatEuroFromCents } from "./money";
import { PageError, PageLoading } from "./ui";
import type { BrandProfileResponse } from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; walletBalanceCents: number };

/** Placeholder demo metrics — not from the API. */
const DEMO_METRICS = {
  reach: 128_400,
  clicks: 3_210,
  leads: 86,
} as const;

export function BrandResults() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    api
      .get<BrandProfileResponse>("/brand/me")
      .then((data) => {
        if (cancelled) return;
        setState({
          status: "ready",
          walletBalanceCents: data.profile.walletBalanceCents,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Could not load results.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <PageLoading label="Loading results…" />;
  }

  if (state.status === "error") {
    return <PageError message={state.message} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Results
      </h1>
      <p className="mt-2 text-sm text-muted">
        Campaign performance at a glance.
      </p>

      <p
        role="note"
        className="mt-4 rounded-lg border border-sky-deep/60 bg-sky/40 px-3 py-2 text-sm text-navy"
      >
        Demo stub — metrics below are placeholder values for the walkthrough,
        not live analytics.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Reach"
          value={DEMO_METRICS.reach.toLocaleString("en-IE")}
        />
        <MetricCard
          label="Clicks"
          value={DEMO_METRICS.clicks.toLocaleString("en-IE")}
        />
        <MetricCard
          label="Leads"
          value={DEMO_METRICS.leads.toLocaleString("en-IE")}
        />
        <MetricCard
          label="Spend (wallet)"
          value={formatEuroFromCents(state.walletBalanceCents)}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sky-deep/50 bg-surface/80 px-4 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-xl font-extrabold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}

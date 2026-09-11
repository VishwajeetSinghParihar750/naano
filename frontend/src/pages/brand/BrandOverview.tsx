import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { Icon } from "../../components/ui/Icon";
import { formatEuroFromCents } from "./money";
import { PageError, PageLoading } from "./ui";
import { StatusBadge } from "./statusBadge";
import type { BrandOverviewResponse } from "./types";

export function BrandOverview() {
  const [data, setData] = useState<BrandOverviewResponse["overview"] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<BrandOverviewResponse>("/brand/overview")
      .then((res) => setData(res.overview))
      .catch((err: unknown) =>
        setError(
          err instanceof ApiError ? err.message : "Could not load dashboard.",
        ),
      );
  }, []);

  if (error) return <PageError message={error} />;
  if (!data) return <PageLoading label="Loading dashboard…" />;

  const site = data.website ?? data.company;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono-label">Dashboard</p>
          <h1 className="text-heading mt-1 max-w-2xl text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
            What&apos;s happening for{" "}
            <span className="text-accent underline decoration-[var(--border)] underline-offset-4">
              {site}
            </span>{" "}
            on naano
          </h1>
        </div>
        <Link to="/brand/campaigns/new" className="btn-navy btn-sm">
          <Icon icon={Plus} size="sm" strokeWidth={2} />
          New campaign
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Creators activated", data.metrics.creatorsActivated],
          ["Posts published", data.metrics.postsPublished],
          ["Open bookings", data.metrics.openBookings],
          ["Impressions", data.metrics.impressions],
        ].map(([label, value]) => (
          <div key={String(label)} className="card-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString("en-US") : value}
            </p>
          </div>
        ))}
      </div>

      <section className="card-surface mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Bookings</h2>
          <Link
            to="/brand/collaborations"
            className="text-sm font-semibold underline"
          >
            All collaborations
          </Link>
        </div>
        {data.bookings.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No bookings yet. Book a creator below or from{" "}
            <Link to="/brand/marketplace" className="underline">
              Explore
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {data.bookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold">{b.creator.name}</p>
                  <p className="text-xs text-muted">{b.campaign.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <span className="font-semibold">
                    {formatEuroFromCents(b.agreedRateCents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="text-lg font-semibold">To do</h2>
          <p className="mt-1 text-sm text-muted">Priority actions</p>
          <ul className="mt-4 space-y-3">
            {data.todos.map((t) => (
              <li key={t.id}>
                <Link
                  to={
                    t.id === "launch"
                      ? "/brand/campaigns/new"
                      : "/brand/marketplace"
                  }
                  className="flex items-center justify-between rounded-sm border border-border px-3 py-3 text-sm hover:bg-surface-secondary"
                >
                  <span className="font-semibold">{t.label}</span>
                  {t.suggested ? (
                    <span className="rounded-sm bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                      Suggested
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Product summary
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            {data.valueProp ??
              "Add your website during onboarding to generate a product summary."}
          </p>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            New creators{" "}
            <span className="rounded-sm bg-surface-secondary px-2 py-0.5 text-xs text-muted">
              {data.newCreators.length}
            </span>
          </h2>
          <Link
            to="/brand/marketplace"
            className="text-sm font-semibold underline"
          >
            Explore
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.newCreators.map((c) => (
            <div key={c.id} className="card-surface flex min-h-[14rem] flex-col p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground">
                {c.name.slice(0, 1)}
              </div>
              <p className="mt-3 font-semibold">{c.name}</p>
              <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted">
                {c.industries?.slice(0, 3).join(" · ") || c.niche}
              </p>
              <div className="mt-auto border-t border-border pt-3">
                <p className="text-sm font-semibold">
                  from {formatEuroFromCents(c.ratePerPostCents)} /post
                </p>
                <Link
                  to="/brand/marketplace"
                  className="btn-navy btn-sm mt-3 w-full"
                >
                  Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { DealLinkCard } from "../../components/creator/DealLinkCard";
import { Icon } from "../../components/ui/Icon";
import { ApiError, api } from "../../lib/api";
import { formatUsdFromCents } from "./money";
import { PageError, PageHeader, PageLoading } from "./ui";
import { StatusBadge } from "./statusBadge";
import type {
  CreatorCollaboration,
  CreatorCollaborationsResponse,
  CreatorProfile,
  CreatorProfileResponse,
} from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      profile: CreatorProfile;
      collaborations: CreatorCollaboration[];
    };

export function CreatorHome() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [me, collabs] = await Promise.all([
          api.get<CreatorProfileResponse>("/creator/me"),
          api.get<CreatorCollaborationsResponse>("/creator/collaborations"),
        ]);
        if (cancelled) return;
        setState({
          status: "ready",
          profile: me.profile,
          collaborations: collabs.collaborations,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Could not load your overview.",
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <PageLoading label="Loading your overview…" />;
  }
  if (state.status === "error") {
    return <PageError message={state.message} />;
  }

  const { profile, collaborations } = state;
  const assigned = collaborations.filter((c) => c.status === "invited");
  const active = collaborations.filter((c) =>
    ["accepted", "draft_submitted", "live"].includes(c.status),
  );
  const cardReady = profile.cardPublished && profile.ratePerPostCents > 0;

  function dealLink() {
    return `${window.location.origin}/c/${profile.cardSlug}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(dealLink());
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Your creator activity, at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Public Post Reach"
          value="—"
          hint="Estimated from public YouTube activity."
        />
        <MetricCard
          label="Public Posts"
          value={String(
            collaborations.filter((c) => c.status === "live" || c.status === "paid")
              .length,
          )}
          hint="Booked and published collaborations."
        />
        <MetricCard
          label="Public Engagements"
          value="0"
          hint="Reactions, comments and tracked clicks."
        />
        <MetricCard
          label="YouTube subscribers"
          value={
            profile.followers > 0
              ? profile.followers.toLocaleString("en-US")
              : "—"
          }
          hint="From the public YouTube channel."
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Your creator card</h2>
              <p className="mt-1 text-sm text-muted">Share it with brands.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/creator/storefront" className="btn-ghost btn-sm">
                Open card
              </Link>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="btn-ghost btn-sm"
              >
                Copy card link
              </button>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="btn-navy btn-sm"
              >
                Share my card
              </button>
            </div>
          </div>
          <div className="mt-5 flex justify-center">
            <DealLinkCard
              compact
              name={profile.name}
              headline={profile.headline}
              country={profile.country}
              industries={profile.industries}
              followers={profile.followers}
              posts7d={profile.posts7d}
              posts90d={profile.posts90d}
              estImpressions={profile.estImpressions}
              ratePerPostCents={profile.ratePerPostCents}
              dataPending={!profile.followers}
            />
          </div>
        </section>

        <section className="card-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Your launch guide</h2>
              <p className="mt-1 text-sm text-muted">Get bookable, then earn.</p>
            </div>
            <Link to="/creator/storefront" className="text-sm font-semibold text-ink underline">
              Open card
            </Link>
          </div>
          <div className="mt-6 flex items-start justify-between gap-3 rounded-sm border border-border bg-surface-secondary px-4 py-3">
            <div className="flex gap-3">
              <span
                className={[
                  "mt-0.5 flex h-5 w-5 items-center justify-center rounded-sm",
                  cardReady ? "bg-primary text-primary-foreground" : "border border-border",
                ].join(" ")}
              >
                {cardReady ? (
                  <Icon icon={Check} size="sm" strokeWidth={2.5} />
                ) : null}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Card and price ready</p>
                <p className="mt-0.5 text-xs text-muted">
                  Public USD rate is live for brands.
                </p>
              </div>
            </div>
            <Link
              to="/creator/storefront"
              className="rounded-sm bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
            >
              {cardReady ? "Complete" : "Finish"}
            </Link>
          </div>
        </section>
      </div>

      <section className="card-surface mt-6 p-5">
        <h2 className="text-lg font-semibold text-ink">Assigned campaigns</h2>
        <p className="mt-1 text-sm text-muted">Invites waiting for your response.</p>
        {assigned.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No assigned campaigns yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {assigned.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{c.campaign.title}</p>
                  <p className="text-xs text-muted">{c.brand.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {formatUsdFromCents(c.agreedRateCents)}
                  </span>
                  <StatusBadge status={c.status} />
                  <Link
                    to="/creator/opportunities"
                    className="text-sm font-semibold underline"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface mt-6 p-5">
        <h2 className="text-lg font-semibold text-ink">Active collaborations</h2>
        <p className="mt-1 text-sm text-muted">Brand / Status / Next action / Net</p>
        {active.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No active collaborations yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="table-head">
                <tr>
                  <th className="pb-2 font-semibold">Brand</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Next action</th>
                  <th className="pb-2 font-semibold">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {active.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3">
                      <p className="font-semibold">{c.brand.company}</p>
                      <p className="text-xs text-muted">{c.campaign.title}</p>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3 text-muted">
                      {c.status === "accepted"
                        ? "Submit draft"
                        : c.status === "draft_submitted"
                          ? "Awaiting brand"
                          : "Live"}
                    </td>
                    <td className="py-3 font-semibold">
                      {formatUsdFromCents(c.agreedRateCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

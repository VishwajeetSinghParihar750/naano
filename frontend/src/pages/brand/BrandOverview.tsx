import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { formatEuroFromCents } from "./money";
import { PageError, PageLoading } from "./ui";
import type {
  BrandCampaignsResponse,
  BrandCollaborationsResponse,
  BrandProfile,
  BrandProfileResponse,
} from "./types";

const OPEN_COLLAB_STATUSES = new Set([
  "invited",
  "accepted",
  "draft_submitted",
  "live",
]);

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      profile: BrandProfile;
      campaignCount: number;
      openCollabCount: number;
    };

export function BrandOverview() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [me, campaigns, collabs] = await Promise.all([
          api.get<BrandProfileResponse>("/brand/me"),
          api.get<BrandCampaignsResponse>("/brand/campaigns"),
          api.get<BrandCollaborationsResponse>("/brand/collaborations"),
        ]);
        if (cancelled) return;
        const openCollabCount = collabs.collaborations.filter((c) =>
          OPEN_COLLAB_STATUSES.has(c.status),
        ).length;
        setState({
          status: "ready",
          profile: me.profile,
          campaignCount: campaigns.campaigns.length,
          openCollabCount,
        });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Could not load your brand overview.";
        setState({ status: "error", message });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <PageLoading label="Loading your workspace…" />;
  }

  if (state.status === "error") {
    return <PageError message={state.message} />;
  }

  const { profile, campaignCount, openCollabCount } = state;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Overview
      </h1>
      <p className="mt-2 text-sm text-muted">
        Your brand activity, at a glance.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlanceCard label="Company" value={profile.company} />
        <GlanceCard
          label="Wallet"
          value={formatEuroFromCents(profile.walletBalanceCents)}
        />
        <GlanceCard label="Campaigns" value={String(campaignCount)} />
        <GlanceCard
          label="Open collaborations"
          value={String(openCollabCount)}
          accent={openCollabCount > 0}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/brand/campaigns" className="btn-navy text-sm">
          Manage campaigns
        </Link>
        <Link to="/brand/marketplace" className="btn-ghost text-sm">
          Browse marketplace
        </Link>
      </div>
    </div>
  );
}

function GlanceCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-sky-deep/50 bg-surface/80 px-4 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-extrabold tracking-tight ${
          accent ? "text-navy" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

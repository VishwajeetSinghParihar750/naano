import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { formatEuroFromCents } from "./money";
import { PageError, PageLoading } from "./ui";
import type {
  CreatorOpportunitiesResponse,
  CreatorProfile,
  CreatorProfileResponse,
} from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      profile: CreatorProfile;
      openInviteCount: number;
    };

export function CreatorHome() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [me, opps] = await Promise.all([
          api.get<CreatorProfileResponse>("/creator/me"),
          api.get<CreatorOpportunitiesResponse>("/creator/opportunities"),
        ]);
        if (cancelled) return;
        const openInviteCount = opps.opportunities.filter(
          (o) => o.status === "invited",
        ).length;
        setState({
          status: "ready",
          profile: me.profile,
          openInviteCount,
        });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Could not load your studio overview.";
        setState({ status: "error", message });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <PageLoading label="Loading your studio…" />;
  }

  if (state.status === "error") {
    return <PageError message={state.message} />;
  }

  const { profile, openInviteCount } = state;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Welcome
      </h1>
      <p className="mt-2 text-sm text-muted">
        Your creator activity, at a glance.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlanceCard label="Name" value={profile.name} />
        <GlanceCard
          label="Rate per post"
          value={formatEuroFromCents(profile.ratePerPostCents)}
        />
        <GlanceCard
          label="Followers"
          value={profile.followers.toLocaleString("en-IE")}
        />
        <GlanceCard
          label="Open invites"
          value={String(openInviteCount)}
          accent={openInviteCount > 0}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/creator/card" className="btn-navy text-sm">
          Edit card
        </Link>
        <Link to="/creator/opportunities" className="btn-ghost text-sm">
          View opportunities
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

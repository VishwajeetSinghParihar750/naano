import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../../lib/api";
import { formatUsdFromCents } from "./money";
import { PageError, PageHeader, PageLoading } from "./ui";
import { StatusBadge } from "./statusBadge";
import type {
  CollaborationMutationResponse,
  CreatorOpportunitiesResponse,
  CreatorOpportunity,
} from "./types";

export function CreatorOpportunities() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CreatorOpportunity[]>([]);
  const [gated, setGated] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followersGate, setFollowersGate] = useState(100);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<CreatorOpportunitiesResponse>(
        "/creator/opportunities",
      );
      setItems(data.opportunities.filter((o) => o.status === "invited"));
      setGated(Boolean(data.gated));
      setFollowers(data.followers ?? 0);
      setFollowersGate(data.followersGate ?? 100);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load opportunities.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(id: string, action: "accept" | "decline") {
    if (busyId) return;
    setActionError(null);
    setBusyId(id);
    try {
      await api.post<CollaborationMutationResponse>(
        `/creator/collaborations/${id}/${action}`,
      );
      setItems((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : `Could not ${action} this invite.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoading label="Loading opportunities…" />;
  if (error) return <PageError message={error} />;

  return (
    <div>
      <PageHeader
        tourId="creator-opportunities"
        title="Opportunities"
        subtitle="Campaign invites and open briefs for you."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Assigned
          </p>
          <p className="mt-1 text-2xl font-bold">{items.length}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Open briefs
          </p>
          <p className="mt-1 text-2xl font-bold">{items.length}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Followers
          </p>
          <p className="mt-1 text-2xl font-bold">
            {followers > 0 ? followers.toLocaleString("en-US") : "—"}
          </p>
        </div>
      </div>

      {gated ? (
        <div className="card-surface mb-6 border-warning/40 bg-warning-soft p-5">
          <p className="text-base font-semibold text-ink">
            Paid campaigns open at {followersGate} followers
          </p>
          <p className="mt-1 text-sm text-muted">
            You currently have {followers.toLocaleString("en-US")} followers.
            Keep publishing — assigned invites below still need a response.
          </p>
        </div>
      ) : null}

      {actionError ? (
        <p role="alert" className="field-error mb-4">
          {actionError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="card-surface px-4 py-10 text-center text-sm text-muted">
          No open invites right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((opp) => (
            <li key={opp.id} className="card-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {opp.brand.company}
                  </p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-ink">
                    {opp.campaign.title}
                  </h2>
                </div>
                <StatusBadge status={opp.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {opp.campaign.brief}
              </p>
              <p className="mt-3 text-sm font-semibold text-ink">
                Agreed rate: {formatUsdFromCents(opp.agreedRateCents)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === opp.id}
                  onClick={() => void respond(opp.id, "accept")}
                  className="btn-navy btn-sm disabled:opacity-60"
                >
                  {busyId === opp.id ? "Working…" : "Accept"}
                </button>
                <button
                  type="button"
                  disabled={busyId === opp.id}
                  onClick={() => void respond(opp.id, "decline")}
                  className="btn-ghost btn-sm disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

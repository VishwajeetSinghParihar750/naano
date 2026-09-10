import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../../lib/api";
import { formatEuroFromCents } from "./money";
import { PageError, PageLoading } from "./ui";
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<CreatorOpportunitiesResponse>(
        "/creator/opportunities",
      );
      setItems(data.opportunities.filter((o) => o.status === "invited"));
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

  if (loading) {
    return <PageLoading label="Loading opportunities…" />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <div>
      <h1
        data-tour-id="creator-opportunities"
        className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
      >
        Opportunities
      </h1>
      <p className="mt-2 text-sm text-muted">
        Campaign invites waiting for your response.
      </p>

      {actionError ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {actionError}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-sky-deep/50 bg-surface/70 px-4 py-8 text-sm text-muted">
          No open invites right now.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {items.map((opp) => (
            <li
              key={opp.id}
              className="rounded-xl border border-sky-deep/50 bg-surface/80 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {opp.brand.company}
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold tracking-tight text-ink">
                    {opp.campaign.title}
                  </h2>
                </div>
                <StatusBadge status={opp.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {opp.campaign.brief}
              </p>
              <p className="mt-3 text-sm font-semibold text-ink">
                Agreed rate: {formatEuroFromCents(opp.agreedRateCents)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === opp.id}
                  onClick={() => void respond(opp.id, "accept")}
                  className="btn-navy px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyId === opp.id ? "Working…" : "Accept"}
                </button>
                <button
                  type="button"
                  disabled={busyId === opp.id}
                  onClick={() => void respond(opp.id, "decline")}
                  className="btn-ghost px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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

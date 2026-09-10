import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../../lib/api";
import { formatEuroFromCents } from "./money";
import { StatusBadge } from "./statusBadge";
import { PageError, PageLoading } from "./ui";
import type {
  BrandCollaboration,
  BrandCollaborationsResponse,
  CollaborationMutationResponse,
} from "./types";

export function BrandCollaborations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BrandCollaboration[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<BrandCollaborationsResponse>(
        "/brand/collaborations",
      );
      setItems(data.collaborations);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load collaborations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    id: string,
    action: "approve" | "mark-paid",
    okMessage: string,
  ) {
    if (busyId) return;
    setActionError(null);
    setActionOk(null);
    setBusyId(id);
    try {
      const data = await api.post<CollaborationMutationResponse>(
        `/brand/collaborations/${id}/${action}`,
      );
      setItems((prev) =>
        prev.map((c) => (c.id === id ? data.collaboration : c)),
      );
      setActionOk(okMessage);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : `Could not ${action === "approve" ? "approve" : "mark paid"}.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <PageLoading label="Loading collaborations…" />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <div>
      <h1
        data-tour-id="brand-collaborations"
        className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
      >
        Collaborations
      </h1>
      <p className="mt-2 text-sm text-muted">
        Approve drafts and mark completed work as paid.
      </p>

      {actionError ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {actionError}
        </p>
      ) : null}
      {actionOk ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {actionOk}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-sky-deep/50 bg-surface/70 px-4 py-8 text-sm text-muted">
          No collaborations yet. Invite a creator from the Marketplace.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-sky-deep/50 bg-surface/80">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b border-sky-deep/40 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3 font-semibold">Creator</th>
                <th className="px-4 py-3 font-semibold">Campaign</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Rate</th>
                <th className="px-4 py-3 font-semibold">Next action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-sky-deep/30 last:border-0"
                >
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-ink">{c.creator.name}</p>
                    <p className="mt-0.5 text-muted">{c.creator.niche}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-ink">
                    {c.campaign.title}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusBadge status={c.status} />
                    {c.deliverable?.draftUrl ? (
                      <a
                        href={c.deliverable.draftUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block truncate text-xs font-semibold text-navy underline-offset-2 hover:underline"
                      >
                        View draft
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top font-semibold text-ink">
                    {formatEuroFromCents(c.agreedRateCents)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <NextAction
                      collab={c}
                      busy={busyId === c.id}
                      onApprove={() =>
                        void runAction(c.id, "approve", "Draft approved.")
                      }
                      onMarkPaid={() =>
                        void runAction(c.id, "mark-paid", "Marked as paid.")
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NextAction({
  collab,
  busy,
  onApprove,
  onMarkPaid,
}: {
  collab: BrandCollaboration;
  busy: boolean;
  onApprove: () => void;
  onMarkPaid: () => void;
}) {
  if (collab.status === "draft_submitted") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={onApprove}
        className="btn-navy px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Working…" : "Approve"}
      </button>
    );
  }

  if (collab.status === "live") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={onMarkPaid}
        className="btn-navy px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Working…" : "Mark paid"}
      </button>
    );
  }

  if (collab.status === "invited") {
    return <span className="text-muted">Awaiting creator</span>;
  }

  if (collab.status === "accepted") {
    return <span className="text-muted">Awaiting draft</span>;
  }

  if (collab.status === "paid") {
    return <span className="text-muted">Complete</span>;
  }

  if (collab.status === "declined") {
    return <span className="text-muted">—</span>;
  }

  return <span className="text-muted">—</span>;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { safeHttpUrl } from "../../lib/safeHttpUrl";
import { formatEuroFromCents } from "./money";
import { StatusBadge } from "./statusBadge";
import { PageError, PageHeader, PageLoading } from "./ui";
import type {
  BrandCollaboration,
  BrandCollaborationsResponse,
  CollaborationMutationResponse,
  CollaborationStatus,
} from "./types";

type TabId =
  | "all"
  | "active"
  | "needs_action"
  | "invitation"
  | "declined"
  | "completed";

function matchesTab(c: BrandCollaboration, tab: TabId): boolean {
  switch (tab) {
    case "all":
      return true;
    case "active":
      return ["accepted", "draft_submitted", "live"].includes(c.status);
    case "needs_action":
      return c.status === "draft_submitted" || c.status === "live";
    case "invitation":
      return c.status === "invited";
    case "declined":
      return c.status === "declined";
    case "completed":
      return c.status === "paid";
    default:
      return true;
  }
}

function nextAction(c: BrandCollaboration): string {
  switch (c.status) {
    case "invited":
      return "Waiting on creator";
    case "accepted":
      return "Awaiting draft";
    case "draft_submitted":
      return "Review draft";
    case "live":
      return "Mark paid";
    case "paid":
      return "Complete";
    case "declined":
      return "—";
    default:
      return "—";
  }
}

export function BrandCollaborations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BrandCollaboration[]>([]);
  const [tab, setTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [draftPreview, setDraftPreview] = useState<BrandCollaboration | null>(
    null,
  );

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

  const filtered = useMemo(() => {
    return items.filter((c) => {
      if (!matchesTab(c, tab)) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return `${c.creator.name} ${c.campaign.title}`.toLowerCase().includes(q);
    });
  }, [items, tab, search]);

  const committed = items
    .filter((c) => c.status !== "declined")
    .reduce((s, c) => s + c.agreedRateCents, 0);
  const needAction = items.filter((c) => matchesTab(c, "needs_action")).length;

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

  if (loading) return <PageLoading label="Loading collaborations…" />;
  if (error) return <PageError message={error} />;

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
        Workspace · Collaborations
      </div>
      <PageHeader
        tourId="brand-collaborations"
        title="Collaborations"
        subtitle="Manage every creator collaboration from request to payment."
        action={
          <div className="flex flex-wrap gap-2">
            <div className="rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              <span className="font-semibold">{items.length}</span> collaborations
            </div>
            <div className="rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              <span className="font-semibold">
                {formatEuroFromCents(committed)}
              </span>{" "}
              committed
            </div>
            <div className="rounded-sm border border-border bg-surface px-3 py-2 text-sm">
              <span className="font-semibold">{needAction}</span> need action
            </div>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search creators, campaigns…"
          className="field min-w-[14rem] flex-1"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["active", "Active"],
            ["needs_action", "Needs action"],
            ["invitation", "Invitation sent"],
            ["declined", "Declined"],
            ["completed", "Completed"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={["tab-btn", tab === id ? "is-active" : ""]
              .filter(Boolean)
              .join(" ")}
            data-active={tab === id ? "true" : "false"}
          >
            {label} ({items.filter((c) => matchesTab(c, id)).length})
          </button>
        ))}
      </div>

      {actionError ? (
        <p role="alert" className="field-error mb-4">
          {actionError}
        </p>
      ) : null}
      {actionOk ? (
        <p role="status" className="mb-4 text-sm text-accent">
          {actionOk}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="card-surface px-4 py-10 text-center text-sm text-muted">
          No collaborations yet. Invite a creator from the{" "}
          <Link to="/brand/marketplace" className="underline">
            Marketplace
          </Link>
          .
        </p>
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="table-head border-b border-border">
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next action</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.creator.name}</td>
                  <td className="px-4 py-3 text-muted">{c.campaign.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status as CollaborationStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted">{nextAction(c)}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatEuroFromCents(c.agreedRateCents)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {c.updatedAt
                      ? new Date(c.updatedAt).toLocaleDateString("en-US")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {c.status === "draft_submitted" ? (
                        <>
                          <button
                            type="button"
                            className="text-xs font-semibold underline"
                            onClick={() => setDraftPreview(c)}
                          >
                            View draft
                          </button>
                          <button
                            type="button"
                            disabled={busyId === c.id}
                            onClick={() =>
                              void runAction(c.id, "approve", "Approved · live.")
                            }
                            className="btn-navy btn-sm disabled:opacity-60"
                          >
                            Approve
                          </button>
                        </>
                      ) : null}
                      {c.status === "live" ? (
                        <button
                          type="button"
                          disabled={busyId === c.id}
                          onClick={() =>
                            void runAction(c.id, "mark-paid", "Marked paid.")
                          }
                          className="btn-navy btn-sm disabled:opacity-60"
                        >
                          Mark paid
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draftPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="card-surface w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold">Draft preview</h2>
            <p className="mt-2 text-sm text-muted">
              {draftPreview.creator.name} · {draftPreview.campaign.title}
            </p>
            <p className="mt-4 break-all rounded-sm bg-surface-secondary px-3 py-2 text-sm">
              {draftPreview.deliverable?.draftUrl ?? "No URL"}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              {safeHttpUrl(draftPreview.deliverable?.draftUrl) ? (
                <a
                  href={safeHttpUrl(draftPreview.deliverable?.draftUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost btn-sm"
                >
                  Open URL
                </a>
              ) : null}
              <button
                type="button"
                className="btn-navy btn-sm"
                onClick={() => setDraftPreview(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

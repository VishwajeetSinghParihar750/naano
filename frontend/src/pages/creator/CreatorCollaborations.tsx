import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError, api } from "../../lib/api";
import { formatUsdFromCents } from "./money";
import { PageError, PageHeader, PageLoading } from "./ui";
import { StatusBadge } from "./statusBadge";
import type {
  CollaborationStatus,
  CreatorCollaboration,
  CreatorCollaborationsResponse,
  DeliverableMutationResponse,
} from "./types";

type TabId =
  | "all"
  | "active"
  | "needs_action"
  | "applications"
  | "declined"
  | "completed";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "needs_action", label: "Needs action" },
  { id: "applications", label: "Applications sent" },
  { id: "declined", label: "Declined" },
  { id: "completed", label: "Completed" },
];

function matchesTab(c: CreatorCollaboration, tab: TabId): boolean {
  switch (tab) {
    case "all":
      return true;
    case "active":
      return ["accepted", "draft_submitted", "live"].includes(c.status);
    case "needs_action":
      return c.status === "invited" || c.status === "accepted";
    case "applications":
      return c.status === "invited";
    case "declined":
      return c.status === "declined";
    case "completed":
      return c.status === "paid";
    default:
      return true;
  }
}

export function CreatorCollaborations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CreatorCollaboration[]>([]);
  const [tab, setTab] = useState<TabId>("all");
  const [draftUrls, setDraftUrls] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<CreatorCollaborationsResponse>(
        "/creator/collaborations",
      );
      setItems(data.collaborations);
      const urls: Record<string, string> = {};
      for (const c of data.collaborations) {
        urls[c.id] = c.deliverable?.draftUrl ?? "";
      }
      setDraftUrls(urls);
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

  const filtered = useMemo(
    () => items.filter((c) => matchesTab(c, tab)),
    [items, tab],
  );

  const needAction = items.filter((c) =>
    matchesTab(c, "needs_action"),
  ).length;
  const yourNet = items
    .filter((c) => c.status !== "declined")
    .reduce((sum, c) => sum + c.agreedRateCents, 0);

  async function submitDraft(event: FormEvent, id: string) {
    event.preventDefault();
    if (busyId) return;
    const draftUrl = (draftUrls[id] ?? "").trim();
    if (!draftUrl) {
      setActionError("Enter a draft URL before submitting.");
      return;
    }
    setActionError(null);
    setActionOk(null);
    setBusyId(id);
    try {
      const data = await api.post<DeliverableMutationResponse>(
        `/creator/collaborations/${id}/deliverable`,
        { draftUrl },
      );
      setItems((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...data.collaboration,
                deliverable:
                  data.deliverable ?? data.collaboration.deliverable,
              }
            : c,
        ),
      );
      setDraftUrls((prev) => ({
        ...prev,
        [id]: data.deliverable?.draftUrl ?? draftUrl,
      }));
      setActionOk("Draft submitted.");
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Could not submit the draft URL.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <PageLoading label="Loading collaborations…" />;
  if (error) return <PageError message={error} />;

  return (
    <div>
      <PageHeader
        tourId="creator-collaborations"
        title="Collaborations"
        subtitle="Everything moving from brief to publication."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Collaborations
          </p>
          <p className="mt-1 text-2xl font-bold">{items.length}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Need action
          </p>
          <p className="mt-1 text-2xl font-bold">{needAction}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Your net
          </p>
          <p className="mt-1 text-2xl font-bold">{formatUsdFromCents(yourNet)}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={["tab-btn", tab === t.id ? "is-active" : ""]
              .filter(Boolean)
              .join(" ")}
            data-active={tab === t.id ? "true" : "false"}
          >
            {t.label}
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
          No collaborations yet.
        </p>
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="table-head border-b border-border">
                <th className="px-4 py-3">Brand / Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Next action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-ink">{c.brand.company}</p>
                    <p className="mt-0.5 text-muted">{c.campaign.title}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusBadge status={c.status as CollaborationStatus} />
                  </td>
                  <td className="px-4 py-4 align-top font-semibold text-ink">
                    {formatUsdFromCents(c.agreedRateCents)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <NextAction
                      collab={c}
                      draftUrl={draftUrls[c.id] ?? ""}
                      busy={busyId === c.id}
                      onDraftChange={(value) =>
                        setDraftUrls((prev) => ({ ...prev, [c.id]: value }))
                      }
                      onSubmit={(e) => void submitDraft(e, c.id)}
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
  draftUrl,
  busy,
  onDraftChange,
  onSubmit,
}: {
  collab: CreatorCollaboration;
  draftUrl: string;
  busy: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  if (collab.status === "accepted" || collab.status === "draft_submitted") {
    return (
      <form onSubmit={onSubmit} className="flex max-w-xs flex-col gap-2">
        <label className="sr-only" htmlFor={`draft-${collab.id}`}>
          Draft URL
        </label>
        <input
          id={`draft-${collab.id}`}
          type="url"
          placeholder="https://…"
          value={draftUrl}
          onChange={(e) => onDraftChange(e.target.value)}
          className="field"
        />
        <button
          type="submit"
          disabled={busy}
          className="btn-navy btn-sm w-fit disabled:opacity-60"
        >
          {busy
            ? "Submitting…"
            : collab.status === "draft_submitted"
              ? "Update draft"
              : "Submit draft"}
        </button>
      </form>
    );
  }
  if (collab.status === "invited") {
    return <span className="text-muted">Respond on Opportunities</span>;
  }
  if (collab.status === "declined") return <span className="text-muted">—</span>;
  if (collab.status === "live") {
    return <span className="text-muted">Awaiting payment</span>;
  }
  if (collab.status === "paid") return <span className="text-muted">Complete</span>;
  return <span className="text-muted">—</span>;
}

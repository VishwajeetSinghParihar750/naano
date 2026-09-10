import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, api } from "../../lib/api";
import { formatEuroFromCents } from "./money";
import { PageError, PageLoading } from "./ui";
import { StatusBadge } from "./statusBadge";
import type {
  CreatorCollaboration,
  CreatorCollaborationsResponse,
  DeliverableMutationResponse,
} from "./types";

export function CreatorCollaborations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CreatorCollaboration[]>([]);
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

  if (loading) {
    return <PageLoading label="Loading collaborations…" />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <div>
      <h1
        data-tour-id="creator-collaborations"
        className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
      >
        Collaborations
      </h1>
      <p className="mt-2 text-sm text-muted">
        Everything moving from brief to publication.
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
          No collaborations yet. Accept an invite from Opportunities to get
          started.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-sky-deep/50 bg-surface/80">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-sky-deep/40 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3 font-semibold">Brand / Campaign</th>
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
                    <p className="font-semibold text-ink">
                      {c.brand.company}
                    </p>
                    <p className="mt-0.5 text-muted">{c.campaign.title}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-4 align-top font-semibold text-ink">
                    {formatEuroFromCents(c.agreedRateCents)}
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
          className="w-full rounded-lg border border-sky-deep/70 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/50 focus:ring-2 focus:ring-navy/15"
        />
        <button
          type="submit"
          disabled={busy}
          className="btn-navy w-fit px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
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
    return (
      <span className="text-muted">Respond on Opportunities</span>
    );
  }

  if (collab.status === "declined") {
    return <span className="text-muted">—</span>;
  }

  if (collab.status === "live") {
    return <span className="text-muted">Awaiting payment</span>;
  }

  if (collab.status === "paid") {
    return <span className="text-muted">Complete</span>;
  }

  return <span className="text-muted">—</span>;
}

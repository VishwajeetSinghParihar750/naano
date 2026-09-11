import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/IconButton";
import type {
  BrandCampaignResponse,
  CampaignAiDraft,
  CampaignFromLinkResponse,
  CreateCampaignFromDraftBody,
} from "./types";

const emptyDraft: CampaignAiDraft = {
  title: "",
  destinationUrl: "https://",
  icp: "",
  oneClaim: "",
  mustNots:
    "No unsubstantiated claims. No competitor bashing. Keep it professional.",
};

export function BrandCampaignFromLink() {
  const navigate = useNavigate();
  const [sourceUrl, setSourceUrl] = useState("");
  const [draft, setDraft] = useState<CampaignAiDraft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecover(e: FormEvent) {
    e.preventDefault();
    if (recovering || !sourceUrl.trim()) return;
    setRecovering(true);
    setError(null);
    setNotice(null);
    try {
      const res = await api.post<CampaignFromLinkResponse>(
        "/brand/campaigns/from-link",
        { sourceUrl: sourceUrl.trim() },
      );
      setDraft(res.draft);
      setNotice(res.notice);
    } catch (err) {
      setDraft(emptyDraft);
      setNotice(
        err instanceof ApiError
          ? err.message
          : "I could not fetch that page. Fill in the fields yourself.",
      );
    } finally {
      setRecovering(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (creating || !draft) return;
    setCreating(true);
    setError(null);
    try {
      const body: CreateCampaignFromDraftBody = {
        ...draft,
        budgetCents: 250000,
        status: "active",
      };
      await api.post<BrandCampaignResponse>(
        "/brand/campaigns/from-draft",
        body,
      );
      navigate("/brand/marketplace");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not create campaign.",
      );
    } finally {
      setCreating(false);
    }
  }

  function patchDraft<K extends keyof CampaignAiDraft>(
    key: K,
    value: CampaignAiDraft[K],
  ) {
    setDraft((prev) => ({ ...(prev ?? emptyDraft), [key]: value }));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <IconButton
        icon={ArrowLeft}
        label="Back to launch methods"
        onClick={() => navigate("/brand/campaigns/new")}
        className="border border-border"
      />

      <h1 className="text-heading mt-8 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
        Start from your link
      </h1>
      <p className="mt-2 text-sm text-muted">
        Paste a Notion page, a live campaign, or any public brief URL.
      </p>

      <form
        onSubmit={handleRecover}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch"
      >
        <input
          type="url"
          required
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://notion.so/… or docs.google.com/…"
          className="field min-w-0 flex-1"
          disabled={recovering}
        />
        <button
          type="submit"
          disabled={recovering || !sourceUrl.trim()}
          className="btn-ink shrink-0 disabled:opacity-60"
        >
          {recovering ? (
            <span className="inline-flex items-center gap-2">
              <Icon icon={Loader2} size="sm" className="animate-spin" />
              Recovering…
            </span>
          ) : (
            "Recover brief"
          )}
        </button>
      </form>

      {notice ? (
        <p className="mt-3 text-sm text-muted" role="status">
          {notice}
        </p>
      ) : null}

      {draft ? (
        <form onSubmit={handleCreate} className="mt-6">
          <div className="card-surface space-y-5 p-5">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Title
              </span>
              <input
                required
                value={draft.title}
                onChange={(e) => patchDraft("title", e.target.value)}
                placeholder="Campaign title"
                className="field mt-1.5"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Destination URL
              </span>
              <input
                required
                type="url"
                value={draft.destinationUrl}
                onChange={(e) => patchDraft("destinationUrl", e.target.value)}
                className="field mt-1.5"
              />
              <span className="mt-1.5 block text-xs text-muted">
                Your landing page (product, signup, or site). Not LinkedIn.
                Creators will post a tracking short link that redirects here with
                UTM tags.
              </span>
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                ICP
              </span>
              <textarea
                required
                rows={3}
                value={draft.icp}
                onChange={(e) => patchDraft("icp", e.target.value)}
                placeholder="Who should this campaign reach?"
                className="field mt-1.5 h-auto min-h-[5rem] py-2.5"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                One claim
              </span>
              <textarea
                required
                rows={3}
                value={draft.oneClaim}
                onChange={(e) => patchDraft("oneClaim", e.target.value)}
                placeholder="The one message creators should land"
                className="field mt-1.5 h-auto min-h-[5rem] py-2.5"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Must nots
              </span>
              <textarea
                required
                rows={3}
                value={draft.mustNots}
                onChange={(e) => patchDraft("mustNots", e.target.value)}
                className="field mt-1.5 h-auto min-h-[5rem] py-2.5"
              />
            </label>

            <button
              type="submit"
              disabled={creating}
              className="btn-ink w-full disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create campaign"}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="field-error mt-4">
          {error}
        </p>
      ) : null}
    </div>
  );
}

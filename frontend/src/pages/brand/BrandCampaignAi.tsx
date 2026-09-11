import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUp, Loader2, Sparkles } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/IconButton";
import type {
  BrandCampaignResponse,
  CampaignAiDraft,
  CampaignAiDraftResponse,
  CreateCampaignFromDraftBody,
} from "./types";

const emptyDraft: CampaignAiDraft = {
  title: "",
  destinationUrl: "https://",
  icp: "",
  oneClaim: "",
  mustNots: "",
};

export function BrandCampaignAi() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<CampaignAiDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDraft(e: FormEvent) {
    e.preventDefault();
    if (drafting || !prompt.trim()) return;
    setDrafting(true);
    setError(null);
    try {
      const res = await api.post<CampaignAiDraftResponse>(
        "/brand/campaigns/ai-draft",
        { prompt: prompt.trim() },
      );
      setDraft(res.draft);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not draft the campaign with AI.",
      );
    } finally {
      setDrafting(false);
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

      <div className="mt-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-border text-accent">
          <Icon icon={Sparkles} size="lg" />
        </div>
        <h1 className="text-heading mt-4 text-2xl font-semibold tracking-tight">
          Generate your campaign in one click
        </h1>
        <p className="mt-2 text-sm text-muted">
          Describe what you want. AI returns an editable brief — then you create
          the campaign.
        </p>
      </div>

      <form onSubmit={handleDraft} className="card-surface campaign-ai-composer relative mt-8 p-4">
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Let's build this campaign together…"
          className="campaign-ai-input w-full resize-none border-0 bg-transparent text-sm outline-none ring-0 placeholder:text-muted focus:border-0 focus:shadow-none focus:outline-none focus:ring-0"
          disabled={drafting}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {draft
              ? "Tweak the draft below, or regenerate with a new prompt."
              : "AI fills title, landing URL, ICP, claim, and guardrails."}
          </p>
          <button
            type="submit"
            disabled={drafting || !prompt.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-[var(--shadow-brand)] transition hover:bg-accent-hover disabled:opacity-50"
            aria-label={drafting ? "Drafting" : "Generate brief"}
            title={draft ? "Regenerate" : "Generate"}
          >
            {drafting ? (
              <Icon icon={Loader2} size="sm" className="animate-spin" />
            ) : (
              <Icon icon={ArrowUp} size="sm" strokeWidth={2} />
            )}
          </button>
        </div>
      </form>

      {draft ? (
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <p className="text-sm text-muted">
            I drafted a brief
            {draft.title ? (
              <>
                {" "}
                for <span className="font-semibold text-ink">{draft.title}</span>
              </>
            ) : null}
            . Review it, then create the campaign.
          </p>

          <div className="card-surface space-y-5 p-5">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Title
              </span>
              <input
                required
                value={draft.title}
                onChange={(e) => patchDraft("title", e.target.value)}
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
                className="field mt-1.5"
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
                className="field mt-1.5"
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
                className="field mt-1.5"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="btn-ink w-full disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create campaign"}
          </button>
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

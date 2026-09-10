import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, api } from "../../lib/api";
import { euroInputToCents, formatEuroFromCents } from "./money";
import { CampaignStatusBadge } from "./statusBadge";
import { PageError, PageLoading } from "./ui";
import type {
  BrandCampaign,
  BrandCampaignResponse,
  BrandCampaignsResponse,
  CreateCampaignBody,
} from "./types";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-sky-deep/70 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-navy/50 focus:ring-2 focus:ring-navy/15";
const labelClass =
  "text-xs font-semibold uppercase tracking-[0.08em] text-muted";

export function BrandCampaigns() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [budgetEuros, setBudgetEuros] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<BrandCampaignsResponse>("/brand/campaigns");
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load campaigns.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    setFormError(null);
    setFormOk(null);

    const trimmedTitle = title.trim();
    const trimmedBrief = brief.trim();
    const budgetCents = euroInputToCents(budgetEuros);

    if (!trimmedTitle || !trimmedBrief) {
      setFormError("Title and brief are required.");
      return;
    }
    if (budgetCents <= 0) {
      setFormError("Enter a budget greater than zero.");
      return;
    }

    setCreating(true);
    const body: CreateCampaignBody = {
      title: trimmedTitle,
      brief: trimmedBrief,
      budgetCents,
    };

    try {
      const data = await api.post<BrandCampaignResponse>(
        "/brand/campaigns",
        body,
      );
      setCampaigns((prev) => [data.campaign, ...prev]);
      setTitle("");
      setBrief("");
      setBudgetEuros("");
      setFormOk("Campaign created.");
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Could not create the campaign.",
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <PageLoading label="Loading campaigns…" />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Campaigns
      </h1>
      <p className="mt-2 text-sm text-muted">
        Create briefs and track active campaigns.
      </p>

      <form
        onSubmit={handleCreate}
        noValidate
        className="mt-8 flex max-w-lg flex-col gap-4 rounded-xl border border-sky-deep/50 bg-surface/80 p-5"
      >
        <h2 className="text-lg font-extrabold tracking-tight text-ink">
          New campaign
        </h2>

        <div>
          <label htmlFor="campaign-title" className={labelClass}>
            Title
          </label>
          <input
            id="campaign-title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="campaign-brief" className={labelClass}>
            Brief
          </label>
          <textarea
            id="campaign-brief"
            name="brief"
            required
            rows={4}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="campaign-budget" className={labelClass}>
            Budget (€)
          </label>
          <input
            id="campaign-budget"
            name="budgetEuros"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            required
            value={budgetEuros}
            onChange={(e) => setBudgetEuros(e.target.value)}
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-muted">
            Stored as euro cents on the server.
          </p>
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {formError}
          </p>
        ) : null}

        {formOk ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            {formOk}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={creating}
          className="btn-navy w-fit text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create campaign"}
        </button>
      </form>

      {campaigns.length === 0 ? (
        <p className="mt-8 rounded-xl border border-sky-deep/50 bg-surface/70 px-4 py-8 text-sm text-muted">
          No campaigns yet. Create one above to start inviting creators.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-sky-deep/50 bg-surface/80 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-lg font-extrabold tracking-tight text-ink">
                  {c.title}
                </h2>
                <CampaignStatusBadge status={c.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {c.brief}
              </p>
              <p className="mt-3 text-sm font-semibold text-ink">
                Budget: {formatEuroFromCents(c.budgetCents)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

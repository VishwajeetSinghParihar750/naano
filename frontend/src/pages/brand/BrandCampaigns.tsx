import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { Icon } from "../../components/ui/Icon";
import { formatEuroFromCents } from "./money";
import { CampaignStatusBadge } from "./statusBadge";
import { PageError, PageHeader, PageLoading } from "./ui";
import type { BrandCampaign, BrandCampaignsResponse } from "./types";

type TabId = "all" | "active" | "draft" | "completed";

export function BrandCampaigns() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [tab, setTab] = useState<TabId>("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<BrandCampaignsResponse>("/brand/campaigns");
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load campaigns.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (tab === "all") return true;
      if (tab === "active") return c.status === "active";
      if (tab === "draft") return c.status === "draft";
      if (tab === "completed") return c.status === "completed";
      return true;
    });
  }, [campaigns, tab]);

  const counts = {
    all: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  };

  if (loading) return <PageLoading label="Loading campaigns…" />;
  if (error) return <PageError message={error} />;

  return (
    <div>
      <PageHeader
        tourId="brand-campaigns"
        title="All campaigns"
        subtitle="Find every campaign created since you joined naano, from newest to oldest."
        action={
          <Link to="/brand/campaigns/new" className="btn-navy btn-sm">
            <Icon icon={Plus} size="sm" strokeWidth={2} />
            New campaign
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", `All (${counts.all})`],
              ["active", `Active (${counts.active})`],
              ["draft", `Draft (${counts.draft})`],
              ["completed", `Completed (${counts.completed})`],
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
              {label}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted">{filtered.length} campaigns</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface px-6 py-14 text-center">
          <p className="text-lg font-semibold">Create a campaign</p>
          <p className="mt-2 text-sm text-muted">
            Launch a new campaign in a few minutes — with AI, the naano team, or
            an existing link.
          </p>
          <Link to="/brand/campaigns/new" className="btn-navy mt-6 inline-flex text-sm">
            Get started
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="card-surface flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-semibold text-ink">{c.title}</p>
                <p className="mt-1 line-clamp-1 text-sm text-muted">{c.brief}</p>
              </div>
              <div className="flex items-center gap-3">
                <CampaignStatusBadge status={c.status} />
                <span className="text-sm font-semibold">
                  {formatEuroFromCents(c.budgetCents)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

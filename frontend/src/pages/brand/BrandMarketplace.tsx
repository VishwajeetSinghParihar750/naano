import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkCheck, Globe, X } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/IconButton";
import { formatEuroFromCents } from "./money";
import { PageError, PageHeader, PageLoading } from "./ui";
import type {
  BrandCampaign,
  BrandCampaignsResponse,
  BrandCollaborationsResponse,
  BrandCreatorsResponse,
  CollaborationMutationResponse,
  MarketplaceCreator,
} from "./types";

type TabId = "all" | "mine" | "saved";

function countryCode(country: string): string {
  const c = country.toLowerCase();
  if (c.includes("india")) return "IN";
  if (c.includes("france")) return "FR";
  if (c.includes("united kingdom") || c === "uk") return "UK";
  if (c.includes("united states") || c === "usa" || c === "us") return "US";
  if (c.includes("germany")) return "DE";
  return country.slice(0, 2).toUpperCase() || "INT";
}

function CountryLabel({ country }: { country: string }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted">
      <Icon icon={Globe} size={12} />
      {countryCode(country)}
    </span>
  );
}

export function BrandMarketplace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creators, setCreators] = useState<MarketplaceCreator[]>([]);
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [tab, setTab] = useState<TabId>("all");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [category, setCategory] = useState("all");
  const [followersMin, setFollowersMin] = useState("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [detail, setDetail] = useState<MarketplaceCreator | null>(null);
  const [postCount, setPostCount] = useState<1 | 3>(1);
  const [booking, setBooking] = useState(false);
  const [activating, setActivating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [mineIds, setMineIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError(null);
    try {
      const [creatorsData, campaignsData, collabsData] = await Promise.all([
        api.get<BrandCreatorsResponse>("/brand/creators"),
        api.get<BrandCampaignsResponse>("/brand/campaigns"),
        api.get<BrandCollaborationsResponse>("/brand/collaborations"),
      ]);
      setCreators(creatorsData.creators);
      const all = campaignsData.campaigns;
      setCampaigns(all);
      const active = all.filter((c) => c.status === "active");
      setSelectedCampaignId((prev) => {
        if (prev && all.some((c) => c.id === prev)) return prev;
        return active[0]?.id ?? all[0]?.id ?? "";
      });
      setMineIds(
        new Set(
          collabsData.collaborations
            .map((c) => c.creator.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load the marketplace.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const countries = useMemo(
    () => Array.from(new Set(creators.map((c) => c.country))).sort(),
    [creators],
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          creators.flatMap((c) =>
            c.industries && c.industries.length > 0 ? c.industries : [c.niche],
          ),
        ),
      ).sort(),
    [creators],
  );

  const filtered = useMemo(() => {
    return creators.filter((c) => {
      if (tab === "saved" && !savedIds.has(c.id)) return false;
      if (tab === "mine" && !mineIds.has(c.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${c.name} ${c.headline} ${c.niche}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (country !== "all" && c.country !== country) return false;
      if (category !== "all") {
        const tags =
          c.industries && c.industries.length > 0 ? c.industries : [c.niche];
        if (!tags.includes(category)) return false;
      }
      if (followersMin !== "all") {
        const min = Number(followersMin);
        if (c.followers < min) return false;
      }
      return true;
    });
  }, [creators, tab, savedIds, mineIds, search, country, category, followersMin]);

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bookCreator() {
    if (!detail || booking || activating) return;
    if (!selectedCampaignId) {
      setActionError("Create or select a campaign first.");
      return;
    }
    const selected = campaigns.find((c) => c.id === selectedCampaignId);
    setBooking(true);
    setActionError(null);
    setActionOk(null);
    try {
      if (selected?.status === "draft") {
        setActivating(true);
        await api.post<{ campaign: BrandCampaign }>(
          `/brand/campaigns/${selectedCampaignId}/activate`,
          {},
        );
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === selectedCampaignId ? { ...c, status: "active" } : c,
          ),
        );
        setActivating(false);
      }
      await api.post<CollaborationMutationResponse>(
        `/brand/campaigns/${selectedCampaignId}/invite`,
        { creatorProfileId: detail.id, postCount },
      );
      setActionOk(`Booked ${detail.name}. They'll approve first.`);
      setDetail(null);
      void load();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not book creator.",
      );
    } finally {
      setActivating(false);
      setBooking(false);
    }
  }

  if (loading) return <PageLoading label="Loading marketplace…" />;
  if (error) return <PageError message={error} />;

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const selectedIsDraft = selectedCampaign?.status === "draft";
  const hasActiveCampaign = campaigns.some((c) => c.status === "active");

  const price =
    detail && postCount === 3
      ? detail.bundlePriceCents
      : detail?.ratePerPostCents ?? 0;

  return (
    <div>
      <PageHeader
        tourId="brand-marketplace"
        title="Matched"
        subtitle="Curated creators for your brand brief."
        action={
          <Link to="/brand/campaigns/new" className="btn-navy btn-sm">
            New campaign
          </Link>
        }
      />

      <section className="card-surface mb-6 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          Assign a campaign
        </p>
        <p className="mt-1 text-sm text-muted">
          Book creators into one brief. Choose the campaign first, then press
          Book on a creator. They receive that brief — not a new campaign.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Campaign brief
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="field mt-1.5"
            >
              {campaigns.length === 0 ? (
                <option value="">Create a campaign first</option>
              ) : (
                campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                    {c.status === "draft" ? " (draft)" : ""}
                  </option>
                ))
              )}
            </select>
          </div>
          {campaigns.length === 0 ? (
            <Link to="/brand/campaigns/new" className="btn-ghost btn-sm">
              Create campaign
            </Link>
          ) : null}
        </div>
        {campaigns.length > 0 && !hasActiveCampaign ? (
          <p className="mt-3 text-sm text-muted">
            Your campaigns are still drafts. Booking will activate the selected
            brief first.
          </p>
        ) : null}
        {selectedIsDraft ? (
          <p className="mt-2 text-sm text-muted">
            Selected brief is a draft — Book will activate it, then invite the
            creator.
          </p>
        ) : null}
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "All creators"],
            ["mine", "My creators"],
            ["saved", "Saved"],
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

      <div className="mb-5 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search creators…"
          className="field min-w-[12rem] flex-1"
        />
        <select
          value={followersMin}
          onChange={(e) => setFollowersMin(e.target.value)}
          className="field w-auto"
        >
          <option value="all">Followers</option>
          <option value="1000">1k+</option>
          <option value="5000">5k+</option>
          <option value="10000">10k+</option>
        </select>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="field w-auto"
        >
          <option value="all">Country</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field w-auto"
        >
          <option value="all">Category</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {actionOk ? (
        <p className="mb-4 text-sm text-accent">{actionOk}</p>
      ) : null}
      {actionError && !detail ? (
        <p role="alert" className="field-error mb-4">
          {actionError}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="card-surface px-4 py-10 text-center text-sm text-muted">
          No creators match these filters.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li key={c.id} className="card-surface flex flex-col p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">Match {c.matchScore}</span>
                <IconButton
                  icon={savedIds.has(c.id) ? BookmarkCheck : Bookmark}
                  label={savedIds.has(c.id) ? "Unsave creator" : "Save creator"}
                  onClick={() => toggleSave(c.id)}
                  iconSize="sm"
                  className={savedIds.has(c.id) ? "text-accent" : undefined}
                />
              </div>

              <div className="mt-3 flex flex-1 flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-primary text-xl font-bold text-primary-foreground">
                  {c.name.slice(0, 1)}
                </div>
                <p className="mt-3 flex flex-wrap items-center justify-center gap-2 font-semibold">
                  <span>{c.name}</span>
                  <CountryLabel country={c.country} />
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">
                  {c.headline || "YouTube creator"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-1 border-t border-border pt-3 text-center text-[10px] text-muted">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {c.estCpmCents != null
                      ? formatEuroFromCents(c.estCpmCents)
                      : "—"}
                  </p>
                  CPM
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {c.typicalReach?.toLocaleString("en-US") ?? "—"}
                  </p>
                  Views
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {c.followers > 0
                      ? c.followers.toLocaleString("en-US")
                      : "—"}
                  </p>
                  Followers
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {formatEuroFromCents(c.ratePerPostCents)}
                  </p>
                  <p className="text-[10px] text-muted">per post</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-sm font-semibold text-accent hover:underline"
                    onClick={() => {
                      setDetail(c);
                      setPostCount(1);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetail(c);
                      setPostCount(1);
                      setActionError(null);
                    }}
                    className="btn-navy btn-sm"
                  >
                    Book
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="card-surface grid max-h-[90vh] w-full max-w-4xl overflow-y-auto shadow-[0_16px_48px_rgba(0,0,0,0.65)] lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-primary text-lg font-bold text-primary-foreground">
                    {detail.name.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">{detail.name}</h2>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span>{detail.niche}</span>
                      <span aria-hidden>·</span>
                      <CountryLabel country={detail.country} />
                      <span>{detail.country}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                    Match {detail.matchScore}
                  </span>
                  <IconButton
                    icon={X}
                    label="Close"
                    onClick={() => setDetail(null)}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-sm border border-border bg-surface-secondary p-4">
                  <p className="text-sm font-semibold">Why this match</p>
                  <p className="mt-2 text-sm text-muted">
                    Brands in {detail.niche.toLowerCase()} typically book them
                    for a single sponsored post.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-sm border border-border bg-surface px-2.5 py-1">
                      {detail.typicalReach?.toLocaleString("en-US") ?? "—"}{" "}
                      typical reach
                    </span>
                    <span className="rounded-sm border border-border bg-surface px-2.5 py-1">
                      {detail.followers > 0
                        ? `${detail.followers.toLocaleString("en-US")} followers`
                        : "— followers"}
                    </span>
                  </div>
                </div>
                <div className="rounded-sm border border-border bg-surface-secondary p-4">
                  <p className="text-sm font-semibold">Audience snapshot</p>
                  <p className="mt-1 text-xs text-muted">
                    Inferred from public positioning (industries + headline).
                  </p>
                  <div className="mt-3 h-3 overflow-hidden rounded-sm bg-[var(--border)]">
                    <div className="flex h-full">
                      <span className="w-[22%] bg-ink" />
                      <span className="w-[22%] bg-ink/70" />
                      <span className="w-[22%] bg-ink/50" />
                      <span className="w-[18%] bg-ink/30" />
                      <span className="w-[16%] bg-ink/15" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Founders · Marketing · Engineering · Sales · Other
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold">Book this creator</h3>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => setPostCount(1)}
                  className={[
                    "rounded-sm border px-3 py-3 text-left",
                    postCount === 1
                      ? "border-accent bg-success-soft"
                      : "border-border bg-surface-secondary",
                  ].join(" ")}
                >
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Single post</span>
                    <span>{formatEuroFromCents(detail.ratePerPostCents)}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPostCount(3)}
                  className={[
                    "rounded-sm border px-3 py-3 text-left",
                    postCount === 3
                      ? "border-accent bg-success-soft"
                      : "border-border bg-surface-secondary",
                  ].join(" ")}
                >
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Bundle · 3</span>
                    <span>{formatEuroFromCents(detail.bundlePriceCents)}</span>
                  </div>
                </button>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-muted">
                <li>
                  Typical reach:{" "}
                  {detail.typicalReach?.toLocaleString("en-US") ?? "—"}
                </li>
                <li>
                  Estimated CPM:{" "}
                  {detail.estCpmCents != null
                    ? formatEuroFromCents(detail.estCpmCents)
                    : "—"}
                </li>
                <li>
                  Followers:{" "}
                  {detail.followers > 0
                    ? detail.followers.toLocaleString("en-US")
                    : "—"}
                </li>
              </ul>
              {actionError ? (
                <p role="alert" className="field-error mt-3">
                  {actionError}
                </p>
              ) : null}
              <button
                type="button"
                disabled={booking || activating || !selectedCampaignId}
                onClick={() => void bookCreator()}
                className="btn-navy mt-5 w-full disabled:opacity-60"
              >
                {activating
                  ? "Activating campaign…"
                  : booking
                    ? "Booking…"
                    : selectedIsDraft
                      ? `Activate & book · ${formatEuroFromCents(price)}`
                      : `Book · ${formatEuroFromCents(price)}`}
              </button>
              {!selectedCampaignId ? (
                <p className="mt-2 text-xs text-destructive">
                  Select or create a campaign brief above to enable booking.
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted">
                Secure booking · Creator approves first. You pay{" "}
                {formatEuroFromCents(price)} from your wallet escrow.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

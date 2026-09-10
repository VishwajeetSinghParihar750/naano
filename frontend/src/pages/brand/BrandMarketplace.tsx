import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../../lib/api";
import { formatEuroFromCents } from "./money";
import { PageError, PageLoading } from "./ui";
import type {
  BrandCampaign,
  BrandCampaignsResponse,
  BrandCreatorsResponse,
  CollaborationMutationResponse,
  InviteCreatorBody,
  MarketplaceCreator,
} from "./types";

export function BrandMarketplace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creators, setCreators] = useState<MarketplaceCreator[]>([]);
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [inviteTarget, setInviteTarget] = useState<MarketplaceCreator | null>(
    null,
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [creatorsData, campaignsData] = await Promise.all([
        api.get<BrandCreatorsResponse>("/brand/creators"),
        api.get<BrandCampaignsResponse>("/brand/campaigns"),
      ]);
      setCreators(creatorsData.creators);
      setCampaigns(campaignsData.campaigns);
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

  function openInvite(creator: MarketplaceCreator) {
    setActionError(null);
    setActionOk(null);
    setInviteTarget(creator);
    setSelectedCampaignId(campaigns[0]?.id ?? "");
  }

  function closeInvite() {
    if (inviting) return;
    setInviteTarget(null);
    setSelectedCampaignId("");
  }

  async function submitInvite() {
    if (!inviteTarget || inviting) return;
    if (!selectedCampaignId) {
      setActionError("Select a campaign before inviting.");
      return;
    }
    setActionError(null);
    setActionOk(null);
    setInviting(true);

    const body: InviteCreatorBody = {
      creatorProfileId: inviteTarget.id,
    };

    try {
      await api.post<CollaborationMutationResponse>(
        `/brand/campaigns/${selectedCampaignId}/invite`,
        body,
      );
      setActionOk(`Invite sent to ${inviteTarget.name}.`);
      setInviteTarget(null);
      setSelectedCampaignId("");
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Could not send the invite.",
      );
    } finally {
      setInviting(false);
    }
  }

  if (loading) {
    return <PageLoading label="Loading marketplace…" />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <div>
      <h1
        data-tour-id="brand-marketplace"
        className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
      >
        Marketplace
      </h1>
      <p className="mt-2 text-sm text-muted">
        Published creators ready for collaboration.
      </p>

      {actionError && !inviteTarget ? (
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

      {creators.length === 0 ? (
        <p className="mt-8 rounded-xl border border-sky-deep/50 bg-surface/70 px-4 py-8 text-sm text-muted">
          No published creators yet.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {creators.map((creator) => (
            <li
              key={creator.id}
              className="flex flex-col rounded-xl border border-sky-deep/50 bg-surface/80 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                {creator.niche} · {creator.country}
              </p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-ink">
                {creator.name}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {creator.headline}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="font-semibold text-ink">
                    {formatEuroFromCents(creator.ratePerPostCents)}
                    <span className="font-normal text-muted"> / post</span>
                  </p>
                  <p className="text-muted">
                    {creator.followers.toLocaleString("en-IE")} followers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openInvite(creator)}
                  className="btn-navy px-4 py-2 text-sm"
                >
                  Invite
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {inviteTarget ? (
        <InviteModal
          creator={inviteTarget}
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          inviting={inviting}
          error={actionError}
          onCampaignChange={setSelectedCampaignId}
          onClose={closeInvite}
          onSubmit={() => void submitInvite()}
        />
      ) : null}
    </div>
  );
}

function InviteModal({
  creator,
  campaigns,
  selectedCampaignId,
  inviting,
  error,
  onCampaignChange,
  onClose,
  onSubmit,
}: {
  creator: MarketplaceCreator;
  campaigns: BrandCampaign[];
  selectedCampaignId: string;
  inviting: boolean;
  error: string | null;
  onCampaignChange: (id: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-sky-deep/50 bg-surface p-6 shadow-lg">
        <h2
          id="invite-modal-title"
          className="text-lg font-extrabold tracking-tight text-ink"
        >
          Invite {creator.name}
        </h2>
        <p className="mt-2 text-sm text-muted">
          Choose a campaign for this collaboration invite.
        </p>

        {campaigns.length === 0 ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Create a campaign first, then come back to invite.
          </p>
        ) : (
          <div className="mt-4">
            <label
              htmlFor="invite-campaign"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
            >
              Campaign
            </label>
            <select
              id="invite-campaign"
              value={selectedCampaignId}
              onChange={(e) => onCampaignChange(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-sky-deep/70 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-navy/50 focus:ring-2 focus:ring-navy/15"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={inviting}
            className="btn-ghost px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={inviting || campaigns.length === 0}
            className="btn-navy px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {inviting ? "Sending…" : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

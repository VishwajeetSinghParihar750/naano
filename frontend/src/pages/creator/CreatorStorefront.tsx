import { useEffect, useState } from "react";
import { DealLinkCard } from "../../components/creator/DealLinkCard";
import { ApiError, api } from "../../lib/api";
import { formatUsdFromCents } from "./money";
import { PageError, PageHeader, PageLoading } from "./ui";
import type { CreatorProfile, CreatorProfileResponse } from "./types";

export function CreatorStorefront() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<CreatorProfileResponse>("/creator/me")
      .then((data) => setProfile(data.profile))
      .catch((err: unknown) =>
        setError(
          err instanceof ApiError ? err.message : "Could not load storefront.",
        ),
      );
  }, []);

  if (error) return <PageError message={error} />;
  if (!profile) return <PageLoading label="Loading storefront…" />;

  const share = profile.deal?.creatorShare ?? 0.25;
  const months = profile.deal?.rewardMonths ?? 3;
  const dealUrl = `${window.location.origin}/c/${profile.cardSlug}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(dealUrl);
      setFlash("Deal link copied.");
    } catch {
      setFlash("Could not copy — select the link manually.");
    }
  }

  async function togglePublish() {
    if (busy) return;
    setBusy(true);
    setFlash(null);
    try {
      const data = await api.patch<CreatorProfileResponse>("/creator/me", {
        cardPublished: !profile!.cardPublished,
      });
      setProfile(data.profile);
      setFlash(data.profile.cardPublished ? "Card published." : "Card unpublished.");
    } catch (err) {
      setFlash(err instanceof ApiError ? err.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        tourId="creator-card"
        title="Your card is your deal link"
        subtitle="Share it on your channel. Earn when a brand joins through it."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card-surface space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-sm border border-border bg-surface-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Your share
              </p>
              <p className="mt-2 text-3xl font-bold text-ink">
                {Math.round(share * 100)}%
              </p>
              <p className="mt-1 text-sm text-muted">
                Of revenue from brands that join via your deal link.
              </p>
            </div>
            <div className="rounded-sm border border-border bg-surface-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Reward period
              </p>
              <p className="mt-2 text-3xl font-bold text-ink">{months} months</p>
              <p className="mt-1 text-sm text-muted">
                Attribution window after a brand joins.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Copy or share my Deal Link</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <code className="flex-1 truncate rounded-sm border border-border bg-surface-secondary px-3 py-2 text-xs text-ink">
                {dealUrl}
              </code>
              <button type="button" onClick={() => void copyLink()} className="btn-navy btn-sm">
                Copy
              </button>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="btn-ghost btn-sm"
              >
                Share
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-semibold text-ink">
                Public rate · {formatUsdFromCents(profile.ratePerPostCents)}
              </p>
              <p className="text-xs text-muted">
                {profile.cardPublished
                  ? "Live for brands in the marketplace."
                  : "Not published yet."}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void togglePublish()}
              className="btn-navy btn-sm disabled:opacity-60"
            >
              {profile.cardPublished ? "Unpublish card" : "Publish my card"}
            </button>
          </div>

          {flash ? (
            <p role="status" className="text-sm text-ink">
              {flash}
            </p>
          ) : null}
        </section>

        <div className="flex justify-center lg:justify-end">
          <DealLinkCard
            name={profile.name}
            headline={profile.headline}
            country={profile.country}
            industries={profile.industries}
            followers={profile.followers}
            posts7d={profile.posts7d}
            posts90d={profile.posts90d}
            estImpressions={profile.estImpressions}
            ratePerPostCents={profile.ratePerPostCents}
            dataPending={!profile.followers}
          />
        </div>
      </div>
    </div>
  );
}

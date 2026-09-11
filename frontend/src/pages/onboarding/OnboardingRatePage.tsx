import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { DealLinkCard } from "../../components/creator/DealLinkCard";
import { centsToUsdInput, usdInputToCents } from "../creator/money";
import type { CreatorProfile, CreatorProfileResponse } from "../creator/types";
import { PageError, PageLoading } from "../creator/ui";

export function OnboardingRatePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [rate, setRate] = useState("65.00");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CreatorProfileResponse>("/creator/me")
      .then((data) => {
        setProfile(data.profile);
        setRate(
          centsToUsdInput(
            data.profile.ratePerPostCents > 0
              ? data.profile.ratePerPostCents
              : 6500,
          ),
        );
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : "Could not load profile.",
        );
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch<CreatorProfileResponse>("/creator/me", {
        ratePerPostCents: usdInputToCents(rate),
      });
      navigate("/onboarding/creator/terms");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading label="Loading…" />;
  if (!profile) return <PageError message={error ?? "Profile unavailable."} />;

  const cents = usdInputToCents(rate);

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-8 lg:grid-cols-2 lg:items-start">
      <form onSubmit={handleSubmit} className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Step 3 of 4
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
          Set your rate
        </h1>
        <p className="mt-2 text-sm text-muted">
          Brands see this as your public USD cost per post.
        </p>
        <label className="mt-8 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Rate per post (USD)
        </label>
        <div className="relative mt-1.5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            $
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="field pl-8"
          />
        </div>
        {error ? (
          <p role="alert" className="field-error mt-3">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-navy mt-6 w-full disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>
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
          ratePerPostCents={cents || 6500}
          dataPending={!profile.followers}
        />
      </div>
    </div>
  );
}

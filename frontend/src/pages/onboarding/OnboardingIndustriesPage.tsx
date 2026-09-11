import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { DealLinkCard } from "../../components/creator/DealLinkCard";
import { INDUSTRIES, type CreatorProfile, type CreatorProfileResponse } from "../creator/types";
import { PageError, PageLoading } from "../creator/ui";

export function OnboardingIndustriesPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [country, setCountry] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CreatorProfileResponse>("/creator/me")
      .then((data) => {
        setProfile(data.profile);
        setCountry(data.profile.country || data.profile.registrationCountry || "");
        setSelected(data.profile.industries?.slice(0, 3) ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : "Could not load profile.",
        );
        setLoading(false);
      });
  }, []);

  function toggle(tag: string) {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (selected.length === 0) {
      setError("Pick up to 3 industries.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.patch<CreatorProfileResponse>("/creator/me", {
        country: country.trim(),
        registrationCountry: country.trim(),
        industries: selected,
        niche: selected[0] ?? "",
      });
      navigate("/onboarding/creator/rate");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading label="Loading…" />;
  if (!profile) return <PageError message={error ?? "Profile unavailable."} />;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-8 lg:grid-cols-2 lg:items-start">
      <form onSubmit={handleSubmit} className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Step 2 of 4
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
          Complete your creator card
        </h1>
        <p className="mt-2 text-sm text-muted">
          {profile.name} — public YouTube profile
        </p>

        <label className="mt-8 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Your country
        </label>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
          className="field mt-1.5"
        />

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Your industries (pick up to 3)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INDUSTRIES.map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={[
                  "rounded-sm border px-3 py-1.5 text-sm transition",
                  active ? "chip-active" : "border-border bg-surface text-ink hover:border-ink/30",
                ].join(" ")}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {error ? (
          <p role="alert" className="field-error mt-3">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="btn-navy mt-8 w-full disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </form>

      <div className="flex justify-center lg:justify-end">
        <DealLinkCard
          name={profile.name}
          headline={profile.headline}
          country={country || profile.country}
          industries={selected}
          followers={profile.followers}
          posts7d={profile.posts7d}
          posts90d={profile.posts90d}
          estImpressions={profile.estImpressions}
          ratePerPostCents={profile.ratePerPostCents || 6500}
          dataPending={!profile.followers}
        />
      </div>
    </div>
  );
}

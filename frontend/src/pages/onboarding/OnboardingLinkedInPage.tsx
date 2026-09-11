import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { DealLinkCard } from "../../components/creator/DealLinkCard";
import type {
  CreatorProfile,
  CreatorProfileResponse,
  LinkedInImportResponse,
} from "../creator/types";
import { PageError, PageLoading } from "../creator/ui";

export function OnboardingLinkedInPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CreatorProfileResponse>("/creator/me")
      .then((data) => {
        setProfile(data.profile);
        setUrl(data.profile.linkedinUrl ?? "");
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
      const data = await api.post<LinkedInImportResponse>(
        "/creator/onboarding/linkedin",
        { linkedinUrl: url.trim() },
      );
      setProfile(data.profile);
      // Soft-fail still continues — LinkedIn often returns HTTP 999.
      navigate("/onboarding/creator/industries");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save that LinkedIn URL.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading label="Loading…" />;
  if (!profile) return <PageError message={error ?? "Profile unavailable."} />;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-8 lg:grid-cols-2 lg:items-start">
      <form onSubmit={handleSubmit} className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Step 1 of 4
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
          Creators. Brands. Results.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Paste your public LinkedIn profile URL. We try to fetch your name,
          headline, and follower count. If LinkedIn blocks the fetch, you can
          continue with empty stats and refresh later in Settings.
        </p>
        <label className="mt-8 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          LinkedIn profile URL
        </label>
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/you"
          className="field mt-1.5"
        />
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
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Your marketplace card
          </p>
          <DealLinkCard
            name={profile.name}
            headline={profile.headline}
            country={profile.country}
            industries={profile.industries}
            followers={profile.followers}
            ratePerPostCents={profile.ratePerPostCents || 6500}
            dataPending={!profile.followers}
          />
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, api } from "../../lib/api";
import { centsToEuroInput, euroInputToCents } from "./money";
import { PageError, PageLoading } from "./ui";
import type {
  CreatorProfile,
  CreatorProfileResponse,
  PatchCreatorProfileBody,
} from "./types";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-sky-deep/70 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-navy/50 focus:ring-2 focus:ring-navy/15";
const labelClass =
  "text-xs font-semibold uppercase tracking-[0.08em] text-muted";

type FormState = {
  name: string;
  headline: string;
  niche: string;
  country: string;
  rateEuros: string;
  cardPublished: boolean;
};

function profileToForm(profile: CreatorProfile): FormState {
  return {
    name: profile.name,
    headline: profile.headline,
    niche: profile.niche,
    country: profile.country,
    rateEuros: centsToEuroInput(profile.ratePerPostCents),
    cardPublished: profile.cardPublished,
  };
}

export function CreatorCard() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<CreatorProfileResponse>("/creator/me")
      .then((data) => {
        if (cancelled) return;
        setForm(profileToForm(data.profile));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Could not load your creator card.",
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    setSaveError(null);
    setSavedFlash(false);
    setSaving(true);

    const body: PatchCreatorProfileBody = {
      name: form.name.trim(),
      headline: form.headline.trim(),
      niche: form.niche.trim(),
      country: form.country.trim(),
      ratePerPostCents: euroInputToCents(form.rateEuros),
      cardPublished: form.cardPublished,
    };

    try {
      const data = await api.patch<CreatorProfileResponse>(
        "/creator/me",
        body,
      );
      setForm(profileToForm(data.profile));
      setSavedFlash(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Could not save your card. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoading label="Loading your card…" />;
  }

  if (loadError || !form) {
    return <PageError message={loadError ?? "Profile unavailable."} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Creator card
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        This is how brands discover your positioning and collaboration offer.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 flex max-w-lg flex-col gap-4"
      >
        <div>
          <label htmlFor="card-name" className={labelClass}>
            Name
          </label>
          <input
            id="card-name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="card-headline" className={labelClass}>
            Headline
          </label>
          <input
            id="card-headline"
            name="headline"
            type="text"
            required
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="card-niche" className={labelClass}>
            Niche
          </label>
          <input
            id="card-niche"
            name="niche"
            type="text"
            required
            value={form.niche}
            onChange={(e) => setForm({ ...form, niche: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="card-country" className={labelClass}>
            Country
          </label>
          <input
            id="card-country"
            name="country"
            type="text"
            required
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="card-rate" className={labelClass}>
            Rate per post (€)
          </label>
          <input
            id="card-rate"
            name="rateEuros"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            required
            value={form.rateEuros}
            onChange={(e) => setForm({ ...form, rateEuros: e.target.value })}
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-muted">
            Stored as euro cents on the server.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-sky-deep/50 bg-surface/60 px-3.5 py-3">
          <input
            type="checkbox"
            checked={form.cardPublished}
            onChange={(e) =>
              setForm({ ...form, cardPublished: e.target.checked })
            }
            className="h-4 w-4 rounded border-sky-deep text-navy focus:ring-navy/30"
          />
          <span className="text-sm font-semibold text-ink">
            Publish my card
          </span>
        </label>

        {saveError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {saveError}
          </p>
        ) : null}

        {savedFlash ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            Card saved.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="btn-navy mt-1 w-fit disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

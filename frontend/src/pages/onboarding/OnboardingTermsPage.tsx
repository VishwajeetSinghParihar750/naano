import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import type { CreatorProfileResponse } from "../creator/types";

const TERMS = [
  "Your public creator card shows your rate and industries to brands.",
  "When a brand books you, you accept or decline the collaboration.",
  "You submit a draft URL; the brand reviews before it goes live.",
  "You earn when the collaboration is marked paid.",
  "You are responsible for taxes on income in your country.",
];

export function OnboardingTermsPage() {
  const navigate = useNavigate();
  const [tax, setTax] = useState(false);
  const [invoice, setInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tax || !invoice) {
      setError("Confirm both checkboxes to go live.");
      return;
    }
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch<CreatorProfileResponse>("/creator/me", {
        taxSelfDeclared: true,
        invoiceAuthorized: true,
      });
      await api.post<CreatorProfileResponse>("/creator/onboarding/complete", {});
      navigate("/creator", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not complete.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Step 4 of 4
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
        Go live so brands can book you
      </h1>
      <p className="mt-2 text-sm text-muted">
        Review the marketplace terms, then publish your card.
      </p>
      <ol className="mt-8 space-y-3">
        {TERMS.map((t, i) => (
          <li key={t} className="flex gap-3 text-sm text-ink">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={tax}
            onChange={(e) => setTax(e.target.checked)}
            className="mt-1"
          />
          <span>
            I confirm that I am solely responsible for declaring and paying taxes
            on this income to the tax authorities in my country.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={invoice}
            onChange={(e) => setInvoice(e.target.checked)}
            className="mt-1"
          />
          <span>
            I authorize naano to issue invoices in my name and on my behalf for
            services delivered on this marketplace.
          </span>
        </label>
        {error ? (
          <p role="alert" className="field-error">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-navy w-full disabled:opacity-60"
        >
          {saving ? "Going live…" : "Go live"}
        </button>
      </form>
    </div>
  );
}

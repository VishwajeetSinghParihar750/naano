import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { INDUSTRIES, type CreatorProfile, type CreatorProfileResponse, type LinkedInImportResponse } from "./types";
import { PageError, PageHeader, PageLoading } from "./ui";

export function CreatorSettings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [registrationCountry, setRegistrationCountry] = useState("");
  const [isRegisteredBusiness, setIsRegisteredBusiness] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [legalAddress, setLegalAddress] = useState("");
  const [taxSelfDeclared, setTaxSelfDeclared] = useState(false);
  const [invoiceAuthorized, setInvoiceAuthorized] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");
  const [refreshingYoutube, setRefreshingYoutube] = useState(false);

  useEffect(() => {
    api
      .get<CreatorProfileResponse>("/creator/me")
      .then((data) => {
        const p = data.profile;
        setProfile(p);
        setName(p.name);
        setRegistrationCountry(p.registrationCountry ?? p.country ?? "");
        setIsRegisteredBusiness(Boolean(p.isRegisteredBusiness));
        setLegalName(p.legalName ?? "");
        setLegalAddress(p.legalAddress ?? "");
        setTaxSelfDeclared(p.taxSelfDeclared);
        setInvoiceAuthorized(p.invoiceAuthorized);
        setIndustries(p.industries ?? []);
        setLinkedinUrl(p.linkedinUrl ?? "");
        setYoutubeUrl(p.youtubeUrl ?? "");
        setXUrl(p.xUrl ?? "");
        setAccountHolder(p.bankDetails?.accountHolder ?? "");
        setIban(p.bankDetails?.iban ?? "");
        setBankName(p.bankDetails?.bankName ?? "");
      })
      .catch((err: unknown) =>
        setError(
          err instanceof ApiError ? err.message : "Could not load settings.",
        ),
      );
  }, []);

  function toggleIndustry(tag: string) {
    setIndustries((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFlash(null);
    setError(null);
    try {
      const data = await api.patch<CreatorProfileResponse>("/creator/me", {
        name: name.trim(),
        registrationCountry: registrationCountry.trim() || null,
        country: registrationCountry.trim() || undefined,
        isRegisteredBusiness,
        legalName: legalName.trim() || null,
        legalAddress: legalAddress.trim() || null,
        taxSelfDeclared,
        invoiceAuthorized,
        industries,
        niche: industries[0] ?? undefined,
        linkedinUrl: linkedinUrl.trim() || null,
        youtubeUrl: youtubeUrl.trim() || null,
        xUrl: xUrl.trim() || null,
        bankDetails: {
          accountHolder: accountHolder.trim() || undefined,
          iban: iban.trim() || undefined,
          bankName: bankName.trim() || undefined,
        },
      });
      setProfile(data.profile);
      setFlash("Settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefreshYoutube() {
    if (refreshingYoutube) return;
    const url = youtubeUrl.trim();
    if (!url) {
      setError("Add a YouTube channel URL first.");
      return;
    }
    setRefreshingYoutube(true);
    setFlash(null);
    setError(null);
    try {
      const data = await api.post<LinkedInImportResponse>(
        "/creator/onboarding/youtube",
        { youtubeUrl: url },
      );
      setProfile(data.profile);
      setName(data.profile.name);
      setYoutubeUrl(data.profile.youtubeUrl ?? url);
      setFlash(
        data.partial
          ? data.notice ??
              "Could not refresh full stats from YouTube."
          : `Stats refreshed${
              data.profile.followers
                ? ` · ${data.profile.followers.toLocaleString("en-US")} subscribers`
                : ""
            }${
              data.profile.posts90d
                ? ` · ${data.profile.posts90d} posts (90d)`
                : ""
            }${
              data.profile.estImpressions
                ? ` · ~${data.profile.estImpressions.toLocaleString("en-US")} avg views`
                : ""
            }.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not refresh YouTube stats.",
      );
    } finally {
      setRefreshingYoutube(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    const ok = window.confirm(
      "Permanently delete your creator account? This cannot be undone.",
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete("/creator/me");
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete account.",
      );
      setDeleting(false);
    }
  }

  if (error && !profile) return <PageError message={error} />;
  if (!profile) return <PageLoading label="Loading settings…" />;

  const label =
    "text-xs font-semibold uppercase tracking-[0.08em] text-muted";

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company, profile, social and bank." />

      <form onSubmit={handleSave} className="space-y-6">
        <section className="card-surface space-y-4 p-5">
          <h2 className="text-lg font-semibold">Company and billing</h2>
          <div>
            <label className={label}>Registration country</label>
            <input
              className="field mt-1.5"
              value={registrationCountry}
              onChange={(e) => setRegistrationCountry(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isRegisteredBusiness}
              onChange={(e) => setIsRegisteredBusiness(e.target.checked)}
            />
            Registered business
          </label>
          <div>
            <label className={label}>Legal name</label>
            <input
              className="field mt-1.5"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Legal address</label>
            <textarea
              className="field mt-1.5"
              rows={2}
              value={legalAddress}
              onChange={(e) => setLegalAddress(e.target.value)}
            />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={taxSelfDeclared}
              onChange={(e) => setTaxSelfDeclared(e.target.checked)}
            />
            I confirm that I am solely responsible for declaring and paying taxes
            on this income.
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={invoiceAuthorized}
              onChange={(e) => setInvoiceAuthorized(e.target.checked)}
            />
            I authorize naano to issue invoices in my name and on my behalf.
          </label>
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-lg font-semibold">Personal profile</h2>
          <div>
            <label className={label}>Display name</label>
            <input
              className="field mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <p className="text-sm text-muted">
            Followers:{" "}
            {profile.followers > 0
              ? profile.followers.toLocaleString("en-US")
              : "—"}{" "}
            · Based in: {registrationCountry || "—"}
          </p>
          <p className={label}>Industries (up to 3)</p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((tag) => {
              const active = industries.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleIndustry(tag)}
                  className={[
                    "rounded-sm border px-3 py-1.5 text-sm",
                    active ? "chip-active" : "border-border bg-surface",
                  ].join(" ")}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-lg font-semibold">Social links</h2>
          <div>
            <label className={label}>YouTube</label>
            <input
              className="field mt-1.5"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/@yourchannel"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleRefreshYoutube()}
                disabled={refreshingYoutube || !youtubeUrl.trim()}
                className="btn-ghost btn-sm disabled:opacity-60"
              >
                {refreshingYoutube ? "Refreshing…" : "Refresh YouTube stats"}
              </button>
              <p className="text-xs text-muted">
                Pull real subscriber count from your public channel.
                {profile.followers > 0
                  ? ` Current: ${profile.followers.toLocaleString("en-US")}.`
                  : " Current: 0."}
              </p>
            </div>
          </div>
          <div>
            <label className={label}>LinkedIn</label>
            <input
              className="field mt-1.5"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/you"
            />
          </div>
          <div>
            <label className={label}>X (Twitter)</label>
            <input
              className="field mt-1.5"
              type="url"
              value={xUrl}
              onChange={(e) => setXUrl(e.target.value)}
              placeholder="https://x.com/your-account"
            />
          </div>
        </section>

        <section className="card-surface space-y-4 p-5">
          <h2 className="text-lg font-semibold">Bank details</h2>
          <div>
            <label className={label}>Account holder</label>
            <input
              className="field mt-1.5"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>IBAN / account</label>
            <input
              className="field mt-1.5"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Bank name</label>
            <input
              className="field mt-1.5"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
        </section>

        <section className="card-surface p-5">
          <h2 className="text-lg font-semibold">Nao assistant</h2>
          <p className="mt-1 text-sm text-muted">
            Open Nao anytime from the floating assistant at the bottom of the
            screen.
          </p>
          <button
            type="button"
            className="btn-ghost mt-3 text-sm"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("naano:open-nao"))
            }
          >
            Open Nao
          </button>
        </section>

        {error ? (
          <p role="alert" className="field-error">
            {error}
          </p>
        ) : null}
        {flash ? (
          <p role="status" className="text-sm text-accent">
            {flash}
          </p>
        ) : null}

        <button type="submit" disabled={saving} className="btn-navy disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      <section className="card-surface mt-8 border-destructive/30 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
          Delete your account
        </h2>
        <p className="mt-2 text-sm text-muted">
          Permanently delete your creator account and all associated data. This
          cannot be undone.
        </p>
        <div className="mt-3 rounded-[var(--radius)] border border-destructive/40 bg-destructive-soft px-3 py-2 text-sm text-destructive">
          This action is irreversible. Bookings, messages, earnings history and
          your public creator card will be removed.
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleDelete()}
          className="btn-danger mt-4 disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </button>
      </section>
    </div>
  );
}

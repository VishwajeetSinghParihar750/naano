import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  CreditCard,
  Globe,
  HelpCircle,
  Mail,
  Trash2,
} from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Icon } from "../../components/ui/Icon";
import { PageError, PageHeader, PageLoading } from "./ui";
import type { BrandProfile, BrandProfileResponse } from "./types";

function hostFromWebsite(website: string | null | undefined): string {
  if (!website?.trim()) return "";
  try {
    const withProto = website.includes("://") ? website : `https://${website}`;
    return new URL(withProto).hostname.replace(/^www\./, "");
  } catch {
    return website.replace(/^https?:\/\//i, "").replace(/^www\./, "").split("/")[0] ?? "";
  }
}

function faviconFor(website: string | null | undefined): string | null {
  const host = hostFromWebsite(website);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

export function BrandSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<BrandProfileResponse>("/brand/me")
      .then((data) => {
        setProfile(data.profile);
        setCompany(data.profile.company);
        setWebsite(data.profile.website ?? "");
      })
      .catch((err: unknown) =>
        setError(
          err instanceof ApiError ? err.message : "Could not load settings.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const host = useMemo(() => hostFromWebsite(website || profile?.website), [website, profile?.website]);
  const favicon = useMemo(() => faviconFor(website || profile?.website), [website, profile?.website]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setFlash(null);
    try {
      const data = await api.patch<BrandProfileResponse>("/brand/me", {
        company: company.trim(),
        website: website.trim() || null,
      });
      setProfile(data.profile);
      setCompany(data.profile.company);
      setWebsite(data.profile.website ?? "");
      setFlash("Company details saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    const ok = window.confirm(
      "Permanently delete this company workspace? This cannot be undone.",
    );
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete("/brand/me");
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete account.",
      );
      setDeleting(false);
    }
  }

  if (loading) return <PageLoading label="Loading settings…" />;
  if (!profile && error) return <PageError message={error} />;
  if (!profile) return <PageError message="Profile unavailable." />;

  const displayName = company.trim() || profile.company || "Workspace";

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Your company details for bookings and invoices."
        action={
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("naano:open-nao"))
            }
          >
            <Icon icon={HelpCircle} size="sm" />
            Need help?
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Company */}
        <form onSubmit={handleSave} className="card-surface flex flex-col p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-border bg-surface-secondary">
              {favicon ? (
                <img
                  src={favicon}
                  alt=""
                  className="h-6 w-6 object-contain"
                />
              ) : (
                <Icon icon={Building2} size="sm" className="text-muted" />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink">Company</h2>
              <p className="mt-0.5 text-sm text-muted">
                Shown on invoices, bookings, and your workspace chip.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Company name
              </label>
              <input
                required
                className="field mt-1.5"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Website
              </label>
              <div className="mt-1.5 flex h-10 w-full items-center gap-2.5 rounded-[var(--radius)] border border-[color:var(--input)] bg-surface px-3.5">
                <Icon
                  icon={Globe}
                  size="sm"
                  className="shrink-0 text-muted"
                />
                <input
                  type="url"
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-muted"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>
          </div>

          {error ? (
            <p role="alert" className="field-error mt-4">
              {error}
            </p>
          ) : null}
          {flash ? (
            <p role="status" className="mt-4 text-sm text-accent">
              {flash}
            </p>
          ) : null}

          <div className="mt-auto flex justify-end pt-6">
            <button
              type="submit"
              disabled={saving}
              className="btn-ink disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>

        {/* Workspace */}
        <aside className="card-surface flex flex-col p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Workspace
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-border bg-surface-secondary">
              {favicon ? (
                <img
                  src={favicon}
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <span className="text-sm font-bold text-ink">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{displayName}</p>
              <p className="truncate text-sm text-muted">
                {host || "Add a website"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-[var(--radius)] border border-border bg-surface-secondary px-3 py-2.5 text-sm text-muted">
            <Icon icon={Mail} size="sm" className="mt-0.5 shrink-0" />
            <p className="min-w-0">
              Signed in as{" "}
              <span className="break-all font-medium text-ink">
                {user?.email ?? "—"}
              </span>
            </p>
          </div>

          <Link
            to="/brand/billing"
            className="btn-ghost mt-auto flex w-full justify-center gap-2 pt-6"
          >
            <Icon icon={CreditCard} size="sm" />
            Manage billing and wallet
          </Link>
        </aside>
      </div>

      {/* Danger zone */}
      <section className="card-surface mt-4 border-destructive/25 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive-soft text-destructive">
            <Icon icon={Trash2} size="sm" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-destructive">
              Delete your account
            </h2>
            <p className="mt-1 text-sm text-muted">
              Permanently delete this company workspace and campaign data.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[var(--radius)] border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
          <p className="font-semibold">This action is irreversible</p>
          <p className="mt-1 opacity-90">
            Campaigns, bookings you created, and wallet history will be removed.
          </p>
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

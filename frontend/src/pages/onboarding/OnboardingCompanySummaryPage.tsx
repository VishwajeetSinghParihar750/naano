import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Globe } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { safeHttpUrl } from "../../lib/safeHttpUrl";
import { Icon } from "../../components/ui/Icon";
import type {
  BrandProfile,
  BrandProfileResponse,
  IcpItem,
} from "../brand/types";
import { PageError, PageLoading } from "../brand/ui";

function hostFromWebsite(website: string | null | undefined): string {
  if (!website) return "";
  try {
    const withProto = website.includes("://") ? website : `https://${website}`;
    return new URL(withProto).hostname.replace(/^www\./, "");
  } catch {
    return website;
  }
}

function faviconFor(website: string | null | undefined): string | null {
  const host = hostFromWebsite(website);
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

export function OnboardingCompanySummaryPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [valueProp, setValueProp] = useState("");
  const [icp, setIcp] = useState<IcpItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<BrandProfileResponse>("/brand/me")
      .then((data) => {
        setProfile(data.profile);
        setValueProp(data.profile.valueProp ?? "");
        setIcp(
          Array.isArray(data.profile.icp) && data.profile.icp.length > 0
            ? data.profile.icp
            : [
                { title: "Primary buyer", description: "" },
                { title: "Champion / operator", description: "" },
                { title: "Economic stakeholder", description: "" },
              ],
        );
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : "Could not load summary.",
        );
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post<BrandProfileResponse>("/brand/onboarding/complete", {
        valueProp,
        icp,
      });
      navigate("/brand", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not complete onboarding.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <PageLoading label="Loading summary…" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-6">
        <PageError message={error ?? "Profile unavailable."} />
      </div>
    );
  }

  const host = hostFromWebsite(profile.website);
  const favicon = faviconFor(profile.website);
  const websiteHref = safeHttpUrl(profile.website);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col bg-cream px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="brand-mark" aria-label="naano home">
            n
          </Link>
          <span className="rounded-sm border border-cream-deep px-2.5 py-1 text-xs font-semibold text-muted">
            EN
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-lg flex-1 py-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Step 2 of 2
          </p>
          <div className="mt-3 flex gap-1">
            <span className="h-1 flex-1 rounded-sm bg-cream-deep" />
            <span className="h-1 flex-1 rounded-sm bg-ink" />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Scraped from
          </p>
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-sm border border-cream-deep bg-surface px-3 py-2 text-sm">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] rounded-sm"
              />
            ) : (
              <Icon icon={Globe} size="sm" className="text-muted" />
            )}
            <span className="truncate font-semibold text-ink">
              {profile.company}
            </span>
            <span className="truncate text-muted">{host || profile.website}</span>
          </div>

          <h1 className="mt-8 text-3xl font-bold tracking-tight text-ink">
            Value prop & ICP
          </h1>
          <p className="mt-2 text-sm text-muted">
            Pulled from {host || "your website"}. Edit anything that looks off.
          </p>

          <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Value proposition
          </label>
          <textarea
            required
            rows={6}
            value={valueProp}
            onChange={(e) => setValueProp(e.target.value)}
            className="field mt-1.5"
          />

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            3 ideal customers (ICP)
          </p>
          <div className="mt-3 space-y-4">
            {icp.map((item, idx) => (
              <div key={idx} className="rounded-sm border border-cream-deep bg-surface p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-xs font-bold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <input
                    value={item.title}
                    onChange={(e) => {
                      const next = [...icp];
                      next[idx] = { ...item, title: e.target.value };
                      setIcp(next);
                    }}
                    className="w-full border-0 bg-transparent text-sm font-semibold outline-none"
                  />
                </div>
                <textarea
                  rows={3}
                  value={item.description}
                  onChange={(e) => {
                    const next = [...icp];
                    next[idx] = { ...item, description: e.target.value };
                    setIcp(next);
                  }}
                  className="field mt-2"
                />
              </div>
            ))}
          </div>

          {error ? (
            <p role="alert" className="field-error mt-4">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/onboarding/company/website" className="btn-ghost btn-sm">
              Back
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="btn-navy inline-flex items-center gap-2 text-sm disabled:opacity-60"
            >
              {busy ? "Saving…" : "Go to my dashboard"}
              {!busy ? <Icon icon={ArrowRight} size="sm" /> : null}
            </button>
          </div>
        </form>
      </section>

      <aside className="hidden border-l border-border bg-beige px-10 py-10 lg:flex lg:flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Company snapshot
        </p>
        <div className="mt-6 card-surface p-6">
          <div className="flex items-center gap-3">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg border border-border bg-white object-contain p-1"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-muted">
                <Icon icon={Globe} size="md" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">
                {profile.company}
              </p>
              {websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm text-accent hover:underline"
                >
                  {host || profile.website}
                </a>
              ) : (
                <span className="truncate text-sm text-muted">
                  {host || profile.website || "No website"}
                </span>
              )}
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-[color:var(--copy)]">
            {valueProp
              ? valueProp.slice(0, 360) + (valueProp.length > 360 ? "…" : "")
              : "Run Analyze on the previous step to pull public copy from this site."}
          </p>
          <ul className="mt-5 space-y-2 border-t border-border pt-4">
            {icp.slice(0, 3).map((item) => (
              <li key={item.title} className="text-sm">
                <span className="font-semibold text-ink">{item.title}</span>
                {item.description ? (
                  <span className="text-muted"> — {item.description.slice(0, 90)}
                    {item.description.length > 90 ? "…" : ""}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-auto pt-8 text-xs text-muted">
          Source: public pages on {host || "your website"}
        </p>
      </aside>
    </div>
  );
}

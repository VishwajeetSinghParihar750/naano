import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import { Icon } from "../../components/ui/Icon";
import type { BrandProfileResponse } from "../brand/types";

export function OnboardingCompanyWebsitePage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("https://");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post<BrandProfileResponse>("/brand/onboarding/analyze", {
        websiteUrl: url.trim(),
      });
      navigate("/onboarding/company/summary");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not analyze website.",
      );
    } finally {
      setBusy(false);
    }
  }

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
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Step 1 of 2
          </p>
          <div className="mt-3 flex gap-1">
            <span className="h-1 flex-1 rounded-sm bg-ink" />
            <span className="h-1 flex-1 rounded-sm bg-cream-deep" />
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-ink">
            Your website
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We start a background crawl, then you wait on the next screen. We
            pull copy, favicon, and logo from the public site.
          </p>
          <label className="mt-8 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Your website
          </label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourcompany.com"
            className="field mt-1.5"
          />
          {error ? (
            <p role="alert" className="field-error mt-3">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="btn-navy mt-6 w-full disabled:opacity-60"
          >
            {busy ? "Analyzing…" : "Analyze my website"}
          </button>
        </form>
      </section>

      <aside className="hidden flex-col justify-between border-l border-border bg-beige px-10 py-10 text-ink lg:flex">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
            Website analysis
          </p>
          <h2 className="text-heading mt-6 text-4xl font-bold leading-tight">
            We read your
            <br />
            public site.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[color:var(--copy)]">
            Next we fetch your homepage, pull the value proposition, and draft
            three ideal-customer personas from what your company actually says
            online — not a generic marketplace pitch.
          </p>
          <ul className="mt-8 space-y-2.5 text-sm text-[color:var(--copy)]">
            {[
              "Live fetch of your public HTML",
              "Value prop grounded in your copy",
              "ICP personas you can edit before saving",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Icon
                  icon={Check}
                  size="sm"
                  className="mt-0.5 shrink-0 text-success"
                  strokeWidth={2}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted">Takes a few seconds after you submit</p>
      </aside>
    </div>
  );
}

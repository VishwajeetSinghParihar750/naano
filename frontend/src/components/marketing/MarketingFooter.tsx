import { Link } from "react-router-dom";

export function MarketingFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline"
          aria-label="naano home"
        >
          <span className="brand-mark h-8 w-8 text-[11px]">n</span>
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-ink">
            naano
          </span>
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <Link to="/" className="no-underline hover:text-ink">
            For companies
          </Link>
          <Link to="/creators" className="no-underline hover:text-ink">
            For creators
          </Link>
          <Link to="/pricing" className="no-underline hover:text-ink">
            Pricing
          </Link>
          <Link to="/login" className="no-underline hover:text-ink">
            Sign in
          </Link>
        </nav>
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} Naano
        </p>
      </div>
    </footer>
  );
}

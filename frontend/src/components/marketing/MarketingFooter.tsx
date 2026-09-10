import { Link } from "react-router-dom";

export function MarketingFooter() {
  return (
    <footer className="mt-auto border-t border-sky-deep/50 bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          to="/"
          className="text-lg font-extrabold tracking-tight text-ink no-underline"
        >
          naano
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
          © {new Date().getFullYear()} Naano. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

import { Link, NavLink, useLocation } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "text-sm font-medium transition-colors",
    isActive ? "text-ink" : "text-muted hover:text-ink",
  ].join(" ");

export function MarketingHeader() {
  const { pathname } = useLocation();
  const isCreators = pathname.startsWith("/creators");

  return (
    <header className="sticky top-0 z-40 border-b border-sky-deep/40 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight text-ink no-underline"
        >
          naano
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            For companies
          </NavLink>
          <NavLink to="/creators" className={navLinkClass}>
            For creators
          </NavLink>
          <NavLink to="/pricing" className={navLinkClass}>
            Pricing
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-muted no-underline hover:text-ink"
          >
            Sign in
          </Link>
          {isCreators ? (
            <Link
              to="/register?role=influencer"
              className="btn-navy px-3 py-2 text-sm sm:px-4"
            >
              Start earning
            </Link>
          ) : (
            <Link to="/register" className="btn-navy px-3 py-2 text-sm sm:px-4">
              Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

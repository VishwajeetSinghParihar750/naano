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
    <header className="neon-topbar sticky top-0 z-40">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline"
          aria-label="naano home"
        >
          <span className="brand-mark">n</span>
          <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-ink sm:text-base">
            naano
          </span>
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
            <Link to="/register?role=influencer" className="btn-navy btn-sm">
              Start earning
            </Link>
          ) : (
            <Link to="/register" className="btn-navy btn-sm">
              Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

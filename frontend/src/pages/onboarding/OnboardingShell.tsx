import { Link, Outlet } from "react-router-dom";

export function OnboardingShell() {
  return (
    <div className="bg-atmosphere min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <Link to="/" className="brand-mark" aria-label="naano home">
          n
        </Link>
        <span className="rounded-sm border border-border px-2.5 py-1 font-mono text-xs font-semibold text-muted">
          EN
        </span>
      </header>
      <Outlet />
    </div>
  );
}

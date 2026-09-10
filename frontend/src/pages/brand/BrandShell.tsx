import { NavLink, Outlet } from "react-router-dom";
import { AppShell } from "../../components/app/AppShell";

const navItems = [
  { to: "/brand", label: "Overview", end: true },
  { to: "/brand/marketplace", label: "Marketplace", end: false },
  { to: "/brand/campaigns", label: "Campaigns", end: false },
  { to: "/brand/collaborations", label: "Collaborations", end: false },
] as const;

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    "block rounded-lg px-3 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-navy text-white"
      : "text-muted hover:bg-surface hover:text-ink",
  ].join(" ");
}

export function BrandShell() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        <aside className="md:w-52 md:shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Brand workspace
          </p>
          <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <Outlet />
        </section>
      </div>
    </AppShell>
  );
}

import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  DollarSign,
  LayoutGrid,
  Link2,
  MessageSquare,
  Settings,
  ShoppingBag,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Icon } from "../../components/ui/Icon";
import { IconButton, MenuItem } from "../../components/ui/IconButton";
import type { CreatorEarningsResponse } from "./types";
import { formatUsdFromCents } from "./money";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { to: "/creator", label: "Overview", end: true, icon: LayoutGrid },
  { to: "/creator/storefront", label: "Storefront", icon: ShoppingBag },
  { to: "/creator/opportunities", label: "Opportunities", icon: Target },
  { to: "/creator/collaborations", label: "Collaborations", icon: Briefcase },
  { to: "/creator/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/creator/earnings", label: "Earnings", icon: DollarSign },
  { to: "/creator/community", label: "Community", icon: Users },
  { to: "/creator/affiliate", label: "Affiliate", icon: Link2 },
  { to: "/creator/messages", label: "Nao", icon: MessageSquare },
];

function iconBtnClass(active: boolean): string {
  return [
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
    active ? "neon-nav-active" : "neon-nav-idle",
  ].join(" ");
}

function rowClass(active: boolean): string {
  return [
    "flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors",
    active ? "bg-beige text-ink" : "text-muted hover:bg-secondary hover:text-ink",
  ].join(" ");
}

export function CreatorShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [availableCents, setAvailableCents] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<CreatorEarningsResponse>("/creator/earnings")
      .then((data) => {
        if (!cancelled) setAvailableCents(data.earnings.availableNowCents);
      })
      .catch(() => {
        /* wallet pill stays at 0 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  const initial = (user?.email?.[0] ?? "C").toUpperCase();

  return (
    <div className="bg-atmosphere relative flex min-h-screen">
      <div className="w-16 shrink-0" aria-hidden />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-surface py-4 shadow-[8px_0_28px_rgba(55,53,47,0.06)] transition-[width] duration-200 ease-out",
          expanded ? "w-[15.5rem] px-3" : "w-16 items-center px-0",
        ].join(" ")}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        aria-label="Creator navigation"
      >
        <NavLink
          to="/creator"
          end
          className={[
            "mb-5 flex items-center",
            expanded ? "gap-2.5 px-2" : "justify-center",
          ].join(" ")}
          aria-label="naano home"
        >
          <span className="brand-mark">n</span>
          {expanded ? (
            <span className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-ink">
              naano
            </span>
          ) : null}
        </NavLink>

        <nav
          className={[
            "flex flex-1 flex-col gap-1 overflow-y-auto pb-2",
            expanded ? "" : "items-center",
          ].join(" ")}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              aria-label={item.label}
              className={({ isActive }) =>
                expanded ? rowClass(isActive) : iconBtnClass(isActive)
              }
            >
              <Icon icon={item.icon} size={expanded ? "sm" : "md"} />
              {expanded ? <span className="min-w-0 truncate">{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to="/creator/settings"
          title="Settings"
          aria-label="Settings"
          className={({ isActive }) =>
            expanded ? rowClass(isActive) : iconBtnClass(isActive)
          }
        >
          <Icon icon={Settings} size={expanded ? "sm" : "md"} />
          {expanded ? <span className="min-w-0 truncate">Settings</span> : null}
        </NavLink>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="neon-topbar sticky top-0 z-20 flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-ink">
            naano
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <IconButton
              icon={Settings}
              label="Settings"
              className="hidden sm:inline-flex"
              onClick={() => navigate("/creator/settings")}
            />
            <button
              type="button"
              onClick={() => navigate("/creator/earnings")}
              className="pill-balance"
              title="Available earnings"
            >
              {formatUsdFromCents(availableCents)}
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="avatar-btn"
                aria-label="Account menu"
                title="Account"
              >
                {initial}
              </button>
              {menuOpen ? (
                <div className="dropdown-panel absolute right-0 mt-2 w-52 overflow-hidden py-1">
                  <p className="truncate border-b border-border px-3 py-2 font-mono text-xs text-muted">
                    {user?.email}
                  </p>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/creator/settings");
                    }}
                  >
                    Settings
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/creator/earnings");
                    }}
                  >
                    Earnings
                  </MenuItem>
                  <div className="border-t border-border">
                    <MenuItem
                      danger
                      disabled={signingOut}
                      onClick={() => void handleSignOut()}
                    >
                      {signingOut ? "Signing out…" : "Sign out"}
                    </MenuItem>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

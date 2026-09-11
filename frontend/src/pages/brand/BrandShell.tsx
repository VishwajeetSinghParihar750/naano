import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  ChevronDown,
  CreditCard,
  LayoutGrid,
  Layers,
  Megaphone,
  MessageSquare,
  Plus,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Icon } from "../../components/ui/Icon";
import { IconButton, MenuItem } from "../../components/ui/IconButton";
import { formatEuroFromCents } from "./money";
import type { BrandProfileResponse, BrandWalletResponse } from "./types";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: LucideIcon;
};

const primaryNav: NavItem[] = [
  { to: "/brand", label: "Overview", end: true, icon: LayoutGrid },
  { to: "/brand/marketplace", label: "Creators", icon: Users },
  { to: "/brand/collaborations", label: "Collaborations", icon: Briefcase },
];

const collapsedNav: NavItem[] = [
  ...primaryNav,
  { to: "/brand/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/brand/billing", label: "Billing", icon: CreditCard },
];

function hostnameLabel(website: string | null | undefined, company: string | undefined) {
  if (website) {
    try {
      const withProto = website.includes("://") ? website : `https://${website}`;
      return new URL(withProto).hostname.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  return company?.trim() || "Workspace";
}

function iconBtnClass(active: boolean): string {
  return [
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
    active ? "neon-nav-active" : "neon-nav-idle",
  ].join(" ");
}

function rowClass(active: boolean): string {
  return [
    "flex h-10 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors duration-150",
    active ? "bg-beige text-ink" : "text-muted hover:bg-secondary hover:text-ink",
  ].join(" ");
}

export function BrandShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [balanceCents, setBalanceCents] = useState(0);
  const [workspaceLabel, setWorkspaceLabel] = useState("Workspace");
  const [expanded, setExpanded] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const onCampaigns = location.pathname.startsWith("/brand/campaigns");

  useEffect(() => {
    if (onCampaigns) setWorkspaceOpen(true);
  }, [onCampaigns]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BrandWalletResponse>("/brand/wallet")
      .then((data) => {
        if (!cancelled) setBalanceCents(data.wallet.balanceCents);
      })
      .catch(() => {
        /* keep last */
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<BrandProfileResponse>("/brand/me")
      .then((data) => {
        if (cancelled) return;
        setWorkspaceLabel(
          hostnameLabel(data.profile.website, data.profile.company),
        );
      })
      .catch(() => {
        /* default */
      });
    return () => {
      cancelled = true;
    };
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

  const initial = (user?.email?.[0] ?? "B").toUpperCase();

  return (
    <div className="bg-atmosphere relative flex min-h-screen">
      {/* layout spacer = collapsed icon rail width */}
      <div className="w-16 shrink-0" aria-hidden />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-surface py-4 shadow-[8px_0_28px_rgba(55,53,47,0.06)] transition-[width] duration-200 ease-out",
          expanded ? "w-[15.5rem] px-3" : "w-16 items-center px-0",
        ].join(" ")}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        aria-label="Brand navigation"
      >
        <Link
          to="/brand"
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
        </Link>

        {!expanded ? (
          <>
            <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto">
              {collapsedNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  aria-label={item.label}
                  className={({ isActive }) => iconBtnClass(isActive)}
                >
                  <Icon icon={item.icon} size="md" />
                </NavLink>
              ))}
            </nav>
            <NavLink
              to="/brand/messages"
              title="Nao"
              aria-label="Nao AI chat"
              className={({ isActive }) => iconBtnClass(isActive)}
            >
              <Icon icon={MessageSquare} size="md" />
            </NavLink>
          </>
        ) : (
          <>
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Workspace
            </p>
            <div className="mt-2 mb-4 flex h-9 items-center rounded-full border border-border bg-surface px-3 text-sm font-medium text-ink">
              <span className="truncate">{workspaceLabel}</span>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {primaryNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => rowClass(isActive)}
                >
                  <Icon icon={item.icon} size="sm" />
                  <span className="min-w-0 truncate">{item.label}</span>
                </NavLink>
              ))}

              <div className="mt-0.5">
                <button
                  type="button"
                  onClick={() => setWorkspaceOpen((v) => !v)}
                  className={rowClass(onCampaigns || workspaceOpen)}
                  aria-expanded={workspaceOpen}
                >
                  <Icon icon={Layers} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-left">Workspace</span>
                  <Icon
                    icon={ChevronDown}
                    size="sm"
                    className={["shrink-0", workspaceOpen ? "rotate-0" : "-rotate-90"].join(" ")}
                  />
                </button>
                {workspaceOpen ? (
                  <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border pl-3">
                    <NavLink
                      to="/brand/campaigns/new"
                      className={({ isActive }) =>
                        [
                          "flex h-9 min-w-0 items-center gap-2 rounded-lg px-2 text-sm font-medium",
                          isActive ? "text-accent" : "text-accent hover:bg-accent-soft",
                        ].join(" ")
                      }
                    >
                      <Icon icon={Plus} size="sm" strokeWidth={2.25} />
                      <span className="truncate">Create campaign</span>
                    </NavLink>
                    <NavLink
                      to="/brand/campaigns"
                      end
                      className={({ isActive }) =>
                        [
                          "flex h-9 min-w-0 items-center rounded-lg px-2 text-sm font-medium",
                          isActive
                            ? "bg-beige text-ink"
                            : "text-muted hover:bg-secondary hover:text-ink",
                        ].join(" ")
                      }
                    >
                      <span className="truncate">All campaigns</span>
                    </NavLink>
                    <div
                      className="flex h-9 cursor-default items-center justify-between gap-2 rounded-lg px-2 text-sm font-medium text-muted"
                      title="Coming soon"
                    >
                      <span className="min-w-0 truncate">Leads &amp; Analytics</span>
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
                        Beta
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </nav>

            <div className="mt-3 space-y-0.5 border-t border-border pt-3">
              <NavLink
                to="/brand/messages"
                className={({ isActive }) => rowClass(isActive)}
              >
                <Icon icon={MessageSquare} size="sm" />
                <span className="min-w-0 truncate">Nao</span>
              </NavLink>
              <NavLink
                to="/brand/billing"
                className={({ isActive }) => rowClass(isActive)}
              >
                <Icon icon={CreditCard} size="sm" />
                <span className="min-w-0 truncate">Billing</span>
              </NavLink>
            </div>
          </>
        )}
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
              onClick={() => navigate("/brand/settings")}
            />
            <Link to="/brand/billing" className="pill-balance" title="Wallet balance">
              {formatEuroFromCents(balanceCents)}
            </Link>
            <Link
              to="/brand/campaigns/new"
              className="hidden h-8 items-center gap-2 rounded-full border border-border px-2.5 text-xs font-semibold text-ink sm:inline-flex"
              title="Create campaign"
            >
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-accent px-1 text-[10px] text-accent">
                1/3
              </span>
              <span className="max-w-[8rem] truncate">Create campaign</span>
            </Link>
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
                      navigate("/brand/settings");
                    }}
                  >
                    Settings
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/brand/billing");
                    }}
                  >
                    Billing
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/brand/campaigns/new");
                    }}
                  >
                    New campaign
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

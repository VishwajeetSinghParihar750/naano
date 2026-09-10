import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

type AppShellProps = {
  heading?: string;
  note?: string;
  children?: ReactNode;
};

/** Authed shell: top bar with sign out; content via children (or heading/note). */
export function AppShell({ heading, note, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      // Session is cleared client-side by logout regardless; still leave.
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="bg-atmosphere flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-sky-deep/40 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="text-xl font-extrabold tracking-tight text-ink">
            naano
          </span>
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <span className="hidden text-sm text-muted sm:inline">
                {user.email}
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="btn-ghost px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {heading || note ? (
          <div className="mb-8">
            {heading ? (
              <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {heading}
              </h1>
            ) : null}
            {note ? (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                {note}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

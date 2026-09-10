import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../lib/auth";

function appPathForRole(role: Role): string {
  return role === "creator" ? "/creator" : "/brand";
}

function AuthLoading() {
  return (
    <div className="bg-atmosphere flex min-h-screen items-center justify-center">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-sky-deep border-t-navy"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}

export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (status === "anon" || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={appPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

export function RequireAnon({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return <AuthLoading />;
  }

  if (status === "authed" && user) {
    return <Navigate to={appPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

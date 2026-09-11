import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { BrandProfileResponse } from "../pages/brand/types";
import { PageError, PageLoading } from "../pages/brand/ui";

export function RequireBrandOnboarding({
  mode,
}: {
  mode: "app" | "onboarding";
}) {
  const { user, status } = useAuth();
  const location = useLocation();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; complete: boolean }
  >({ status: "loading" });

  useEffect(() => {
    if (status === "loading") return;
    if (!user || user.role !== "brand") {
      setState({ status: "ready", complete: true });
      return;
    }
    let cancelled = false;
    api
      .get<BrandProfileResponse>("/brand/me")
      .then((data) => {
        if (cancelled) return;
        setState({
          status: "ready",
          complete: Boolean(data.profile.onboardingComplete),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Could not load onboarding status.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [user, status, location.pathname]);

  if (status === "loading" || state.status === "loading") {
    return (
      <div className="bg-atmosphere flex min-h-screen items-center justify-center">
        <PageLoading label="Loading…" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="bg-atmosphere flex min-h-screen items-center justify-center p-6">
        <PageError message={state.message} />
      </div>
    );
  }

  if (mode === "app" && !state.complete) {
    return <Navigate to="/onboarding/company/website" replace />;
  }
  if (mode === "onboarding" && state.complete) {
    return <Navigate to="/brand" replace />;
  }

  return <Outlet />;
}

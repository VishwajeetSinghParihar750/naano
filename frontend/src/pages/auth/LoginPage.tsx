import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../../components/auth/AuthShell";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.08em] text-muted";

const DEMO_PASSWORD = "naano-demo-pass";
const DEMO_CREATOR_EMAIL = "amelie.dubois@creator.naano.test";
const DEMO_BRAND_EMAIL = "growth@runanywhere.naano.test";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoBusy, setDemoBusy] = useState<"creator" | "brand" | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || demoBusy) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "creator" ? "/creator" : "/brand", {
        replace: true,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(role: "creator" | "brand") {
    if (submitting || demoBusy) return;
    setError(null);
    setDemoBusy(role);
    const demoEmail =
      role === "creator" ? DEMO_CREATOR_EMAIL : DEMO_BRAND_EMAIL;
    try {
      await login(demoEmail, DEMO_PASSWORD);
      navigate(role === "creator" ? "/creator" : "/brand", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Demo login failed. Is the API running and seeded?");
      }
    } finally {
      setDemoBusy(null);
    }
  }

  return (
    <AuthShell
      storyHeading="Welcome back."
      storyBody="Sign in to manage your campaigns, creators and payouts, all in one place."
    >
      <h1 className="text-heading text-2xl font-semibold tracking-tight text-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to manage your campaigns, creators and payouts, all in one
        place.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8 flex flex-col gap-4"
      >
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@company.com"
            className="field mt-1.5"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <span
              className="cursor-not-allowed text-xs font-medium text-muted/80"
              title="Coming soon"
              aria-disabled
            >
              Forgot password?
            </span>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="field mt-1.5"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="field-error"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || demoBusy !== null}
          className="btn-navy mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-8" data-tour-id="auth-demo">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          Try the demo
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={submitting || demoBusy !== null}
            onClick={() => void handleDemoLogin("creator")}
            className="btn-navy flex-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {demoBusy === "creator" ? "Signing in…" : "Demo as creator"}
          </button>
          <button
            type="button"
            disabled={submitting || demoBusy !== null}
            onClick={() => void handleDemoLogin("brand")}
            className="btn-ghost flex-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {demoBusy === "brand" ? "Signing in…" : "Demo as brand"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-accent no-underline hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

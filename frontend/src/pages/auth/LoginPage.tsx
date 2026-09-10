import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../../components/auth/AuthShell";
import { OAuthButtons } from "../../components/auth/OAuthButtons";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-sky-deep/70 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-navy/50 focus:ring-2 focus:ring-navy/15";
const labelClass =
  "text-xs font-semibold uppercase tracking-[0.08em] text-muted";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
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

  return (
    <AuthShell
      storyHeading="Welcome back."
      storyBody="Sign in to manage your campaigns, creators and payouts, all in one place."
    >
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to manage your campaigns, creators and payouts, all in one
        place.
      </p>

      <div className="mt-8">
        <OAuthButtons />
      </div>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-sky-deep/60" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-sky-deep/60" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
            className={fieldClass}
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
            className={fieldClass}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="btn-navy mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-navy no-underline hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AuthShell } from "../../components/auth/AuthShell";
import { OAuthButtons } from "../../components/auth/OAuthButtons";
import { Icon } from "../../components/ui/Icon";
import { ApiError } from "../../lib/api";
import { useAuth, type Role } from "../../lib/auth";

const labelClass =
  "text-xs font-semibold uppercase tracking-[0.08em] text-muted";

const ROLE_CARDS: {
  role: Role;
  title: string;
  body: string;
}[] = [
  {
    role: "creator",
    title: "I'm a creator",
    body: "Get paid to create content for B2B brands you actually use.",
  },
  {
    role: "brand",
    title: "I'm a brand",
    body: "Find creators, launch campaigns, and trace real pipeline back to each post.",
  },
];

function roleFromQuery(value: string | null): Role | null {
  if (value === "influencer" || value === "creator") return "creator";
  if (value === "saas" || value === "brand") return "brand";
  return null;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const preselected = roleFromQuery(params.get("role"));
  const [role, setRole] = useState<Role | null>(preselected);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !role) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = await register({
        role,
        email,
        password,
        name: name.trim() || undefined,
      });
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

  const signInLink = (
    <p className="mt-6 text-sm text-muted">
      Already have an account?{" "}
      <Link
        to="/login"
        className="font-semibold text-accent no-underline hover:underline"
      >
        Sign in
      </Link>
    </p>
  );

  if (!role) {
    return (
      <AuthShell
        storyHeading="One platform. Two sides."
        storyBody="Creators get paid to post. B2B brands get real pipeline. Pick where you fit and we'll set the rest up in a couple of minutes."
      >
        <h1 className="text-heading text-2xl font-semibold tracking-tight text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted">First, who are you here as?</p>

        <div className="mt-8 flex flex-col gap-3">
          {ROLE_CARDS.map((card) => (
            <button
              key={card.role}
              type="button"
              onClick={() => {
                setError(null);
                setRole(card.role);
              }}
              className="group card-surface p-5 text-left transition hover:border-ink/20 focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <span className="flex items-center justify-between">
                <span className="text-base font-bold text-ink">
                  {card.title}
                </span>
                <Icon
                  icon={ArrowRight}
                  size="sm"
                  className="text-accent transition group-hover:translate-x-0.5"
                />
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-muted">
                {card.body}
              </span>
            </button>
          ))}
        </div>

        {signInLink}
      </AuthShell>
    );
  }

  const roleTitle =
    role === "creator" ? "Create your creator account" : "Create your brand account";

  return (
    <AuthShell
      storyHeading="One platform. Two sides."
      storyBody="Creators get paid to post. B2B brands get real pipeline. Pick where you fit and we'll set the rest up in a couple of minutes."
    >
      <button
        type="button"
        onClick={() => {
          setError(null);
          setRole(null);
        }}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted no-underline transition hover:text-ink"
      >
        <Icon icon={ArrowLeft} size="sm" />
        Back
      </button>

      <h1 className="text-heading text-2xl font-semibold tracking-tight text-ink">
        {roleTitle}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Signing up as{" "}
        <span className="font-semibold text-ink">
          {role === "creator" ? "a creator" : "a brand"}
        </span>
        .
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
          <label htmlFor="name" className={labelClass}>
            {role === "creator" ? "Display name" : "Company name"}{" "}
            <span className="font-normal normal-case text-muted/70">
              (optional)
            </span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "creator" ? "Amélie Dubois" : "Run Anywhere"}
            className="field mt-1.5"
          />
        </div>

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
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="field mt-1.5"
          />
          <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>
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
          disabled={submitting}
          className="btn-navy mt-1 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      {signInLink}
    </AuthShell>
  );
}

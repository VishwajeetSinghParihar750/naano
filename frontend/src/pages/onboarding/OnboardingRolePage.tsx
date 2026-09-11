import { Link } from "react-router-dom";

export function OnboardingRolePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        How will you use naano?
      </h1>
      <p className="mt-3 max-w-lg text-muted">
        Choose a path. You can always create another account later.
      </p>
      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        <Link
          to="/register?role=saas"
          className="card-surface p-6 text-left transition hover:border-ink/20"
        >
          <p className="text-lg font-semibold text-ink">Business</p>
          <p className="mt-2 text-sm text-muted">
            Run campaigns and book creators.
          </p>
        </Link>
        <Link
          to="/register?role=influencer"
          className="card-surface p-6 text-left transition hover:border-ink/20"
        >
          <p className="text-lg font-semibold text-ink">Creator</p>
          <p className="mt-2 text-sm text-muted">
            Publish your card and get booked by brands.
          </p>
        </Link>
      </div>
    </div>
  );
}

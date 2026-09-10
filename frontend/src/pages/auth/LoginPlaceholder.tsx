import { Link } from "react-router-dom";

export function LoginPlaceholder() {
  return (
    <div className="bg-atmosphere flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-sky-deep/60 bg-surface p-8 text-center shadow-sm">
        <p className="text-xl font-extrabold tracking-tight text-ink">naano</p>
        <h1 className="mt-4 text-2xl font-bold text-ink">Sign in</h1>
        <p className="mt-3 text-muted">Auth ships in S05</p>
        <Link to="/" className="btn-navy mt-8 inline-flex">
          Back to home
        </Link>
      </div>
    </div>
  );
}

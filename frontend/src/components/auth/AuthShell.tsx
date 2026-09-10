import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthShellProps = {
  children: ReactNode;
  storyHeading: string;
  storyBody: string;
};

/**
 * Split-screen auth scaffold: form on the left, brand story on the right.
 * Reuses the marketing sky/navy tokens and atmosphere background.
 */
export function AuthShell({ children, storyHeading, storyBody }: AuthShellProps) {
  return (
    <div className="bg-atmosphere min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:min-h-0">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight text-ink no-underline"
          >
            naano
          </Link>
          <div className="flex flex-1 flex-col justify-center py-10">
            {children}
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 80% 0%, rgba(184,217,239,0.28) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(232,244,251,0.16) 0%, transparent 50%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-center px-14 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-deep">
            naano
          </p>
          <h2 className="mt-6 max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white">
            {storyHeading}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
            {storyBody}
          </p>
        </div>
      </div>
    </div>
  );
}

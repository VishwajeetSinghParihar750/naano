import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthShellProps = {
  children: ReactNode;
  storyHeading: string;
  storyBody: string;
};

/**
 * Split-screen auth scaffold — Naano paper + brand-soft story panel.
 */
export function AuthShell({ children, storyHeading, storyBody }: AuthShellProps) {
  return (
    <div className="bg-atmosphere min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:min-h-0">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <Link
            to="/"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-ink no-underline"
          >
            naano
          </Link>
          <div className="flex flex-1 flex-col justify-center py-10">
            {children}
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-beige lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 80% 10%, rgba(197,235,253,0.65), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(232,240,254,0.7), transparent 50%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-center px-14 py-16">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            naano
          </p>
          <h2 className="text-heading mt-6 max-w-md text-3xl font-extrabold leading-tight">
            {storyHeading}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[color:var(--copy)]">
            {storyBody}
          </p>
        </div>
      </div>
    </div>
  );
}

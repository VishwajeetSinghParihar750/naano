import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Icon } from "./Icon";

export function PageLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-sm text-muted">
      <Icon icon={Loader2} size="md" className="animate-spin text-accent" />
      {label}
    </div>
  );
}

export function PageError({ message }: { message: string }) {
  return (
    <p role="alert" className="field-error">
      {message}
    </p>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  tourId,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  tourId?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1
          data-tour-id={tourId}
          className="text-heading text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]"
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

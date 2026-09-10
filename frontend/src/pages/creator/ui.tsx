export function PageLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-sm text-muted">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-sky-deep border-t-navy"
        aria-hidden
      />
      {label}
    </div>
  );
}

export function PageError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

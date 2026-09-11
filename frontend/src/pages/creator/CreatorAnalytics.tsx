import { PageHeader } from "./ui";

export function CreatorAnalytics() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="See the business impact of your paid collaborations."
        action={
          <span className="tab-btn">All time</span>
        }
      />

      <section className="card-surface p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Your creator momentum
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-ink">
              Public YouTube posts are being imported
            </p>
            <p className="mt-1 max-w-xl text-sm text-muted">
              The profile is ready. Post history and reach update as bookings go
              live and tracking clicks arrive.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">0%</p>
            <p className="text-xs text-muted">
              of published collaborations include performance data
            </p>
            <span className="mt-2 inline-block rounded-sm border border-border bg-surface-secondary px-2.5 py-1 text-xs text-muted">
              No public post found yet
            </span>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Public posts", "0", "Original collaboration posts found"],
          ["Public post reach", "Pending", "Waiting for public post data"],
          ["Public engagements", "0", "Reactions, comments and tracked clicks"],
          ["YouTube subscribers", "0", "Imported from the public channel"],
        ].map(([label, value, hint]) => (
          <div key={label} className="card-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="text-lg font-semibold">Top collaborations</h2>
          <p className="mt-1 text-sm text-muted">
            Open a collaboration to review its full delivery details.
          </p>
          <p className="mt-8 text-center text-sm text-muted">
            Public post import in progress. The first public YouTube posts will
            appear here automatically.
          </p>
        </section>
        <section className="card-surface p-5">
          <h2 className="text-lg font-semibold">Your opportunity journey</h2>
          <p className="mt-1 text-sm text-muted">From applications to completed work.</p>
          <ul className="mt-4 space-y-3 text-sm">
            {["YouTube subscribers", "Public posts", "Posts with reach data", "Public engagements"].map(
              (row) => (
                <li key={row} className="flex items-center justify-between gap-3">
                  <span>{row}</span>
                  <span className="font-semibold">0</span>
                </li>
              ),
            )}
          </ul>
        </section>
      </div>

      <p className="mt-6 flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-3 text-sm text-muted">
        Public YouTube data is being prepared. No personal social login is
        required.
      </p>
    </div>
  );
}

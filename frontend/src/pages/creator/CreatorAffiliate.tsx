import { PageHeader } from "./ui";

export function CreatorAffiliate() {
  return (
    <div>
      <PageHeader
        title="Affiliate"
        subtitle="Recommend naano. Earn when brands or creators join through your link."
      />

      <section className="card-surface p-6">
        <p className="text-sm font-semibold text-ink">Not implemented yet</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Affiliate referrals, tracking, and payouts are not live in this build.
          This page is a placeholder for the upcoming invite-and-earn program
          (share a link, earn a share when someone joins through it).
        </p>
      </section>
    </div>
  );
}

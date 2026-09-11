import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "./ui";

const LEADERBOARD = [
  { name: "Marcus Hale", impressions: "128k", posts: 12 },
  { name: "Amélie Dubois", impressions: "96k", posts: 9 },
  { name: "Raj Patel", impressions: "81k", posts: 8 },
  { name: "Sofia Rossi", impressions: "64k", posts: 7 },
  { name: "Grace Kim", impressions: "52k", posts: 6 },
];

export function CreatorCommunity() {
  return (
    <div>
      <PageHeader
        title="Community"
        subtitle="Learn with other B2B creators, share what works and make your naano identity visible."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-6">
          <h2 className="text-xl font-semibold tracking-tight">
            The room where B2B creators get better together.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Get feedback, compare campaign lessons, and talk to the naano team
            in Slack.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {[
              "Get feedback faster on your content",
              "Create campaign tips that work",
              "Talk directly with the naano team",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Icon
                  icon={Check}
                  size="sm"
                  className="mt-0.5 text-accent"
                  strokeWidth={2}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <a
            href="https://slack.com"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost mt-6 w-full text-sm"
          >
            Join the Slack community
            <Icon icon={ArrowRight} size="sm" />
          </a>
        </section>

        <section className="card-surface p-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Turn your public profile into an always-on Deal Link.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Publish your card to show up here.
          </p>
          <Link to="/creator/storefront" className="btn-navy mt-6 w-full text-sm">
            Publish my card
          </Link>
        </section>
      </div>

      <section className="card-surface mt-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              naano campaign leaderboard
            </h2>
            <p className="mt-1 text-sm text-muted">
              Top creators ranked by estimated impressions from campaign posts.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="tab-btn is-active">Estimated Impressions</span>
            <span className="tab-btn">Posts</span>
          </div>
        </div>
        <ol className="mt-5 divide-y divide-border">
          {LEADERBOARD.map((row, i) => (
            <li
              key={row.name}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono text-xs font-semibold text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold">{row.name}</span>
              </div>
              <div className="flex gap-6 font-mono text-xs text-muted">
                <span>{row.impressions}</span>
                <span>{row.posts} posts</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

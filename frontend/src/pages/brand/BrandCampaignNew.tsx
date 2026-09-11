import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "./ui";

export function BrandCampaignNew() {
  return (
    <div>
      <PageHeader
        title="How do you want to launch your campaign?"
        subtitle="Pick a path. You can always edit the brief before inviting creators."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="card-surface flex flex-col p-5">
          <p className="text-xs font-semibold text-muted">Today · 15 min</p>
          <h2 className="mt-3 text-lg font-semibold">
            Launch free with the naano team
          </h2>
          <p className="mt-2 flex-1 text-sm text-muted">
            A campaign manager turns your selection into a ready-to-launch
            campaign. You validate, they handle the rest.
          </p>
          <Link
            to="/brand/campaigns/new/onboarding"
            className="btn-navy mt-5"
          >
            Book my onboarding
            <Icon icon={ArrowRight} size="sm" />
          </Link>
        </article>

        <article className="card-surface flex flex-col p-5">
          <p className="text-xs font-semibold text-muted">5 min</p>
          <h2 className="mt-3 text-lg font-semibold">Create with AI</h2>
          <p className="mt-2 flex-1 text-sm text-muted">
            AI asks the right questions and prepares a fully editable brief.
          </p>
          <Link to="/brand/campaigns/new/ai" className="btn-ghost btn-sm mt-5">
            Create with AI
          </Link>
        </article>

        <article className="card-surface flex flex-col p-5">
          <p className="text-xs font-semibold text-muted">1 min</p>
          <h2 className="mt-3 text-lg font-semibold">Start from your link</h2>
          <p className="mt-2 flex-1 text-sm text-muted">
            Paste an influence campaign you already ran: naano reuses the brief
            and structure.
          </p>
          <Link
            to="/brand/campaigns/new/from-link"
            className="btn-ghost btn-sm mt-5"
          >
            Start from my link
          </Link>
        </article>
      </div>
    </div>
  );
}

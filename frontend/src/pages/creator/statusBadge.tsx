import type { CollaborationStatus } from "./types";

const STATUS_LABEL: Record<CollaborationStatus, string> = {
  invited: "Invited",
  accepted: "Accepted",
  declined: "Declined",
  draft_submitted: "Draft submitted",
  live: "Live",
  paid: "Paid",
};

const STATUS_CLASS: Record<CollaborationStatus, string> = {
  invited: "bg-sky/80 text-navy ring-sky-deep/60",
  accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  declined: "bg-red-50 text-red-700 ring-red-200",
  draft_submitted: "bg-amber-50 text-amber-900 ring-amber-200",
  live: "bg-sky text-navy ring-sky-deep",
  paid: "bg-navy/10 text-navy ring-navy/20",
};

export function StatusBadge({ status }: { status: CollaborationStatus }) {
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

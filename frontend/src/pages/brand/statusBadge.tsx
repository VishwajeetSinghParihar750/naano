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
  invited: "bg-accent-soft text-accent ring-accent/25",
  accepted: "bg-success-soft text-success ring-success/30",
  declined: "bg-destructive-soft text-destructive ring-destructive/25",
  draft_submitted: "bg-warning-soft text-warning ring-warning/30",
  live: "bg-success-soft text-success ring-success/35",
  paid: "bg-secondary text-foreground ring-border",
};

export function StatusBadge({ status }: { status: CollaborationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-accent ring-1 ring-inset ring-accent/25">
      {label}
    </span>
  );
}

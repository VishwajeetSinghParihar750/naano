import { ArrowUpRight, Globe } from "lucide-react";
import { formatUsdFromCents } from "../../pages/creator/money";
import { Icon } from "../ui/Icon";

export type DealLinkCardProps = {
  name: string;
  industries?: string[];
  headline?: string;
  country?: string;
  followers?: number | null;
  ratePerPostCents: number;
  level?: number;
  posts7d?: number;
  posts90d?: number;
  estImpressions?: number | null;
  dataPending?: boolean;
  compact?: boolean;
};

function countryCode(country?: string): string {
  if (!country) return "INT";
  const c = country.toLowerCase();
  if (c.includes("india")) return "IN";
  if (c.includes("united states") || c === "usa" || c === "us") return "US";
  if (c.includes("united kingdom") || c === "uk") return "UK";
  if (c.includes("germany")) return "DE";
  if (c.includes("france")) return "FR";
  return country.slice(0, 2).toUpperCase();
}

export function DealLinkCard({
  name,
  industries = [],
  headline,
  country,
  followers,
  ratePerPostCents,
  level = 2,
  posts7d = 0,
  posts90d = 0,
  estImpressions = null,
  dataPending = false,
  compact = false,
}: DealLinkCardProps) {
  const industryLine =
    industries.length > 0
      ? industries.slice(0, 3).join(" · ")
      : "YouTube · B2B";

  return (
    <div
      className={[
        "card-surface overflow-hidden text-ink shadow-[var(--shadow-md)]",
        compact ? "w-full max-w-[280px]" : "w-full max-w-[320px]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#FF0000] text-[10px] font-bold text-white">
            ▶
          </span>
          <span className="text-xs font-semibold tracking-tight text-ink">
            naano
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted">
          <Icon icon={Globe} size="sm" />
          <span className="text-[11px] font-semibold tracking-wide">
            {countryCode(country)}
          </span>
          <Icon icon={ArrowUpRight} size="sm" />
        </div>
      </div>

      <div className="px-4 pb-4 pt-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {level}
          </div>
          <p className="mt-3 text-base font-semibold leading-tight text-ink">{name}</p>
          <p className="mt-1 text-xs text-muted">{industryLine}</p>
          <p className="mt-4 min-h-[2.5rem] text-sm leading-snug text-[color:var(--copy)]">
            {headline?.trim()
              ? headline
              : "Your positioning will appear here once you complete your card."}
          </p>
        </div>

        <div className="mt-4 flex justify-center gap-2">
          <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[11px] text-muted">
            {posts7d} posts · 7d
          </span>
          <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[11px] text-muted">
            {posts90d} posts · 90d
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
            <span>Data</span>
            <span className={dataPending ? "text-warning" : "text-success"}>
              {dataPending ? "Pending" : "Ready"}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: dataPending ? "18%" : "100%" }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
          <div>
            <p className="text-sm font-semibold text-ink">
              {followers == null || followers === 0
                ? "—"
                : followers.toLocaleString("en-US")}
            </p>
            <p className="text-[10px] text-muted">Subscribers</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {estImpressions == null || estImpressions === 0
                ? "—"
                : estImpressions.toLocaleString("en-US")}
            </p>
            <p className="text-[10px] text-muted">Est. impressions</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">
              {formatUsdFromCents(ratePerPostCents)}
            </p>
            <p className="text-[10px] text-muted">Chosen cost</p>
          </div>
        </div>
      </div>
    </div>
  );
}

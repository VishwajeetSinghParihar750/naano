export const CREATOR_SHARE = 0.25;
export const REWARD_MONTHS = 3;
export const FOLLOWERS_GATE = 100;

export function slugifyCardSlug(name: string, fallback: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const stem = base || "creator";
  const suffix = fallback.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  return `${stem}-${suffix || Date.now().toString(36)}`;
}

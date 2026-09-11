import { Chrome, Linkedin } from "lucide-react";
import { Icon } from "../ui/Icon";

const PROVIDERS = [
  { key: "linkedin", label: "Continue with LinkedIn", icon: Linkedin },
  { key: "google", label: "Continue with Google", icon: Chrome },
] as const;

/** OAuth is out of scope for S05 — buttons are visible but disabled. */
export function OAuthButtons() {
  return (
    <div className="flex flex-col gap-3">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.key}
          type="button"
          disabled
          title="Coming soon"
          className="btn-ghost w-full cursor-not-allowed justify-between opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            <Icon icon={provider.icon} size="sm" />
            {provider.label}
          </span>
          <span className="text-xs font-medium text-muted">coming soon</span>
        </button>
      ))}
    </div>
  );
}

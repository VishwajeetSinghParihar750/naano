import { Sparkles } from "lucide-react";
import { Icon } from "../ui/Icon";

export function AIButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={open ? "Collapse Nao" : "Open Nao"}
      aria-label={open ? "Collapse Nao" : "Open Nao"}
      aria-expanded={open}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition hover:bg-accent-soft"
    >
      <Icon icon={Sparkles} size="sm" strokeWidth={1.85} />
    </button>
  );
}

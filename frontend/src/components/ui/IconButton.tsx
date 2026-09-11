import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon, type IconSize } from "./Icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  iconSize?: IconSize;
};

/** Icon-only control with accessible name + native tooltip. */
export function IconButton({
  icon,
  label,
  iconSize = "md",
  className,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={[
        "icon-btn inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-150",
        "hover:bg-secondary hover:text-ink",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <Icon icon={icon} size={iconSize} />
    </button>
  );
}

export function MenuItem({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "block w-full px-3 py-2 text-left text-sm transition-colors duration-150",
        danger
          ? "text-destructive hover:bg-destructive-soft"
          : "text-ink hover:bg-secondary hover:text-accent",
        "disabled:opacity-60",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

import type { LucideIcon, LucideProps } from "lucide-react";

const SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof SIZE;

type Props = LucideProps & {
  icon: LucideIcon;
  size?: IconSize | number;
};

/** Consistent Lucide wrapper — stroke 1.75, square caps for neon UI. */
export function Icon({
  icon: Lucide,
  size = "md",
  className,
  strokeWidth = 1.75,
  absoluteStrokeWidth,
  ...rest
}: Props) {
  const px = typeof size === "number" ? size : SIZE[size];
  return (
    <Lucide
      size={px}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth ?? false}
      className={["shrink-0", className].filter(Boolean).join(" ")}
      aria-hidden={rest["aria-label"] || rest["aria-labelledby"] ? undefined : true}
      {...rest}
    />
  );
}

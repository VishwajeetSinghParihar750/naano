import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Icon } from "../ui/Icon";

export function AIInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  autoFocus,
  compact,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, compact ? 72 : 120)}px`;
  }, [value, compact]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!disabled && value.trim()) onSubmit();
  }

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        "flex w-full items-end gap-2",
        compact ? "min-h-11" : "min-h-12",
      ].join(" ")}
    >
      <label htmlFor="nao-input" className="sr-only">
        Ask Nao
      </label>
      <textarea
        id="nao-input"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="nao-input max-h-[7.5rem] min-h-[1.5rem] flex-1 resize-none border-0 bg-transparent py-2.5 text-sm leading-snug text-ink shadow-none outline-none ring-0 placeholder:text-[color:var(--foreground-mute)] focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!canSend}
        title={disabled ? "Generating…" : "Send"}
        aria-label={disabled ? "Generating" : "Send message"}
        className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-[var(--shadow-brand)] transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {disabled ? (
          <Icon icon={Loader2} size="sm" className="animate-spin" />
        ) : (
          <Icon icon={ArrowUp} size="sm" strokeWidth={2.25} />
        )}
      </button>
    </form>
  );
}

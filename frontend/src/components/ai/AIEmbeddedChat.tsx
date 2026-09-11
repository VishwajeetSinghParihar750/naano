import { RotateCcw, Sparkles } from "lucide-react";
import { Icon } from "../ui/Icon";
import { AIInput } from "./AIInput";
import { AIMessageList } from "./AIMessageList";
import { useAiChat } from "./useAiChat";

type Props = {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  className?: string;
};

/** Full-height embedded Nao chat for pages like Messages. */
export function AIEmbeddedChat({
  title = "Nao",
  subtitle = "Your product assistant",
  placeholder = "Ask Nao a question…",
  className,
}: Props) {
  const chat = useAiChat();

  return (
    <section
      className={[
        "card-surface flex min-h-[28rem] flex-col overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon icon={Sparkles} size="sm" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>
        </div>
        {chat.error ? (
          <button
            type="button"
            onClick={() => chat.retryLast()}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-accent hover:bg-accent-soft"
            title="Retry"
          >
            <Icon icon={RotateCcw} size="sm" />
            Retry
          </button>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        <AIMessageList
          messages={chat.messages}
          streamingContent={chat.streaming}
          isStreaming={chat.busy}
        />
        {chat.error ? (
          <p
            role="alert"
            className="mt-2 rounded-[var(--radius)] border border-destructive/25 bg-destructive-soft px-3 py-2 text-xs text-destructive"
          >
            {chat.error}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border px-3 py-2">
        <AIInput
          value={chat.draft}
          onChange={chat.setDraft}
          onSubmit={() => void chat.send(chat.draft)}
          disabled={chat.busy}
          placeholder={placeholder}
        />
        <p className="px-1 pb-1 text-[11px] text-muted">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </section>
  );
}

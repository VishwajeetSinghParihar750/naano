import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, RotateCcw, Sparkles, X } from "lucide-react";
import { Icon } from "../ui/Icon";
import { AIInput } from "./AIInput";
import { AIMessageList } from "./AIMessageList";
import { useAiChat } from "./useAiChat";

export function AIAssistant() {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const chat = useAiChat();

  const hideFab = pathname.includes("/messages");

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("naano:open-nao", onOpen);
    return () => window.removeEventListener("naano:open-nao", onOpen);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (hideFab && !open) {
    return null;
  }

  if (!open) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end px-4 pb-5 sm:px-5 sm:pb-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Ask Nao"
          aria-label="Open Nao assistant"
          aria-expanded={false}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-md)] transition hover:bg-primary-hover"
        >
          <Icon icon={Sparkles} size="lg" strokeWidth={1.85} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-4 sm:px-4 sm:pb-5"
    >
      <div className="pointer-events-auto flex w-full max-w-[440px] flex-col items-stretch gap-2">
        <section
          id={panelId}
          role="dialog"
          aria-label="Nao assistant"
          className="nao-panel flex max-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface shadow-[var(--shadow-lg)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-ink">Nao</p>
              <p className="truncate text-xs text-muted">Your product assistant</p>
            </div>
            <div className="flex items-center gap-1">
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-secondary hover:text-ink"
                title="Close Nao"
                aria-label="Close Nao"
              >
                <Icon icon={X} size="sm" />
              </button>
            </div>
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

          <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted">
            Enter to send · Shift+Enter for a new line
          </div>
        </section>

        <div className="mx-auto w-full max-w-[400px]">
          <div className="nao-dock flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5 shadow-[var(--shadow-md)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Close Nao"
              aria-label="Close Nao"
              aria-expanded
              aria-controls={panelId}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition hover:bg-accent-soft"
            >
              <Icon icon={Sparkles} size="sm" strokeWidth={1.85} />
            </button>
            <div className="min-w-0 flex-1">
              <AIInput
                value={chat.draft}
                onChange={chat.setDraft}
                onSubmit={() => {
                  void chat.send(chat.draft);
                }}
                disabled={chat.busy}
                placeholder="Ask Nao a question…"
                compact
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-ink"
              title="Collapse Nao"
              aria-label="Collapse Nao"
              aria-controls={panelId}
            >
              <Icon icon={ChevronDown} size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type FormEvent } from "react";
import { HelpCircle, X } from "lucide-react";
import { ApiError, api } from "../../lib/api";
import {
  dispatchGuideTour,
  type GuideTourResult,
} from "../../lib/tours";
import { Icon } from "../ui/Icon";

export function GuideBar() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || busy) return;

    setError(null);
    setBusy(true);
    try {
      const result = await api.post<GuideTourResult>("/guide", {
        question: trimmed,
      });
      dispatchGuideTour(result);
      setOpen(false);
      setQuestion("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the guide. Is the API running?",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={panelRef}
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2 sm:bottom-5 sm:right-5"
    >
      {open ? (
        <form
          onSubmit={(e) => void handleAsk(e)}
          className="dropdown-panel pointer-events-auto w-[min(100vw-2rem,22rem)] p-3"
        >
          <label htmlFor="guide-question" className="sr-only">
            Ask the product guide
          </label>
          <input
            id="guide-question"
            type="text"
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask where something lives…"
            disabled={busy}
            className="field"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : (
              <span className="font-mono-label">Naano guide</span>
            )}
            <button
              type="submit"
              disabled={busy || !question.trim()}
              className="btn-navy btn-sm"
            >
              {busy ? "…" : "Ask"}
            </button>
          </div>
        </form>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={open ? "Close guide" : "Open product guide"}
        aria-label={open ? "Close guide" : "Open guide"}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent bg-accent text-white shadow-[var(--shadow-brand)] transition hover:bg-accent-hover"
      >
        <Icon icon={open ? X : HelpCircle} size="lg" strokeWidth={open ? 2 : 1.75} />
      </button>
    </div>
  );
}

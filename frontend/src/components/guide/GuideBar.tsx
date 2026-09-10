import { useState, type FormEvent } from "react";
import { ApiError, api } from "../../lib/api";
import {
  dispatchGuideTour,
  type GuideTourResult,
} from "../../lib/tours";

export function GuideBar() {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
      <form
        onSubmit={(e) => void handleAsk(e)}
        className="pointer-events-auto relative flex w-full max-w-xl items-center gap-2 rounded-xl border border-sky-deep/70 bg-surface/95 px-2.5 py-2 shadow-[0_-4px_24px_rgba(11,31,58,0.12)] backdrop-blur-sm"
      >
        <label htmlFor="guide-question" className="sr-only">
          Ask the product guide
        </label>
        <input
          id="guide-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask where something lives…"
          disabled={busy}
          className="min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-muted/80 focus:ring-0 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          className="shrink-0 rounded-lg bg-navy px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-[#16345c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "…" : "Ask"}
        </button>
        {error ? (
          <p
            role="alert"
            className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 sm:left-4 sm:right-auto"
          >
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

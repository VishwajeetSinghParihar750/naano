import { AIMessage } from "./AIMessage";

export function AIStreamingMessage({ content }: { content: string }) {
  if (!content) {
    return (
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-panel)] border border-border bg-surface-secondary px-3.5 py-2.5">
          <span className="ai-dot" />
          <span className="ai-dot ai-dot-delay-1" />
          <span className="ai-dot ai-dot-delay-2" />
          <span className="sr-only">Generating</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <AIMessage role="assistant" content={content} />
      <span className="absolute -bottom-0.5 left-3 inline-block h-3.5 w-0.5 animate-pulse rounded-full bg-accent" />
    </div>
  );
}

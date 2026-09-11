import { useEffect, useRef } from "react";
import type { AiMessage } from "./streamChat";
import { AIMessage } from "./AIMessage";
import { AIStreamingMessage } from "./AIStreamingMessage";

export function AIMessageList({
  messages,
  streamingContent,
  isStreaming,
}: {
  messages: AiMessage[];
  streamingContent: string;
  isStreaming: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingContent, isStreaming]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 flex-col justify-end px-1 pb-2">
        <p className="text-sm leading-relaxed text-[color:var(--copy)]">
          Ask about campaigns, creators, collaborations, results, messages,
          billing, or your account — I&apos;ll point you to the right place.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-0.5 py-1">
      {messages.map((m) => (
        <AIMessage key={m.id} role={m.role} content={m.content} />
      ))}
      {isStreaming ? <AIStreamingMessage content={streamingContent} /> : null}
      <div ref={endRef} />
    </div>
  );
}

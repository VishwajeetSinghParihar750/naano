import { useEffect, useRef, useState } from "react";
import { streamAiChat, type AiMessage } from "./streamChat";

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAiChat() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function send(text: string, opts?: { resumeFrom?: AiMessage[] }) {
    const trimmed = text.trim();
    if (!trimmed || busy) return false;

    const base = opts?.resumeFrom ?? messages;
    const userMsg: AiMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
    };
    const nextHistory = opts?.resumeFrom != null ? base : [...base, userMsg];

    if (opts?.resumeFrom == null) {
      setMessages(nextHistory);
    }
    setDraft("");
    setError(null);
    setBusy(true);
    setStreaming("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let assembled = "";
    try {
      await streamAiChat(
        nextHistory.map((m) => ({ role: m.role, content: m.content })),
        {
          onDelta: (chunk) => {
            assembled += chunk;
            setStreaming(assembled);
          },
          onDone: () => {
            if (assembled.trim()) {
              setMessages((prev) => [
                ...prev,
                { id: newId(), role: "assistant", content: assembled },
              ]);
            }
            setStreaming("");
            setBusy(false);
          },
          onError: (message) => {
            setError(message);
            setStreaming("");
            setBusy(false);
          },
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setBusy(false);
        setStreaming("");
        return false;
      }
      setError("Something went wrong. Please try again.");
      setBusy(false);
      setStreaming("");
      return false;
    }
    return true;
  }

  function retryLast() {
    const lastUserIdx = [...messages]
      .map((m, i) => ({ m, i }))
      .reverse()
      .find((x) => x.m.role === "user")?.i;
    if (lastUserIdx == null || busy) return;
    const lastUser = messages[lastUserIdx];
    const resume = messages.slice(0, lastUserIdx + 1);
    setMessages(resume);
    void send(lastUser.content, { resumeFrom: resume });
  }

  return {
    draft,
    setDraft,
    messages,
    streaming,
    busy,
    error,
    send,
    retryLast,
  };
}

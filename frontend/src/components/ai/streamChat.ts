export type AiRole = "user" | "assistant";

export type AiMessage = {
  id: string;
  role: AiRole;
  content: string;
};

type StreamHandlers = {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

function apiBase(): string {
  return ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(
    /\/$/,
    "",
  );
}

export async function streamAiChat(
  messages: Pick<AiMessage, "role" | "content">[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${apiBase()}/ai/chat`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
    signal,
  });

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = (await res.json()) as {
        error?: { message?: string };
      };
      if (body.error?.message) message = body.error.message;
    } catch {
      /* keep default */
    }
    handlers.onError(message);
    return;
  }

  if (!res.body) {
    handlers.onError("No response stream from the assistant.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep = buffer.indexOf("\n\n");
    while (sep !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      sep = buffer.indexOf("\n\n");

      const lines = raw.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;

      try {
        const payload = JSON.parse(data) as {
          text?: string;
          message?: string;
          ok?: boolean;
        };
        if (event === "delta" && payload.text) handlers.onDelta(payload.text);
        if (event === "error") {
          handlers.onError(
            payload.message ?? "Something went wrong. Please try again.",
          );
          return;
        }
        if (event === "done") {
          handlers.onDone();
          return;
        }
      } catch {
        /* ignore malformed chunk */
      }
    }
  }

  handlers.onDone();
}

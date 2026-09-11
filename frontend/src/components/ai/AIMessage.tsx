import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeHttpUrl } from "../../lib/safeHttpUrl";

export function AIMessage({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div className={["flex w-full", isUser ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[92%] rounded-[var(--radius-panel)] px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-accent text-white"
            : "border border-border bg-surface-secondary text-ink",
        ].join(" ")}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="ai-md prose-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  const safe = safeHttpUrl(href);
                  if (!safe) {
                    return <span>{children}</span>;
                  }
                  return (
                    <a
                      href={safe}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-accent underline underline-offset-2"
                    >
                      {children}
                    </a>
                  );
                },
                ul: ({ children }) => (
                  <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({ children, className }) => {
                  const block = Boolean(className);
                  if (block) {
                    return (
                      <code className="mt-2 block overflow-x-auto rounded-[var(--radius)] bg-secondary px-2.5 py-2 text-[12px]">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="rounded-[var(--radius-sm)] bg-secondary px-1 py-0.5 text-[12px]">
                      {children}
                    </code>
                  );
                },
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

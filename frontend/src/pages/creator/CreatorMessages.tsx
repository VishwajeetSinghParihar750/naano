import { PageHeader } from "./ui";
import { AIEmbeddedChat } from "../../components/ai/AIEmbeddedChat";

export function CreatorMessages() {
  return (
    <div>
      <PageHeader
        title="Nao"
        subtitle="AI chat only — ask Nao about your creator workspace. No human messaging."
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="card-surface p-3">
          <button
            type="button"
            className="w-full rounded-[var(--radius)] bg-accent-soft px-3 py-3 text-left text-sm font-semibold text-ink ring-1 ring-accent/20"
          >
            Nao
            <span className="mt-1 block text-xs font-normal text-muted">
              Always available · streaming
            </span>
          </button>
        </aside>

        <AIEmbeddedChat
          title="Nao"
          subtitle="Ask about campaigns, creators, collaborations, earnings, and settings"
          placeholder="Ask Nao a question…"
          className="min-h-[32rem]"
        />
      </div>
    </div>
  );
}

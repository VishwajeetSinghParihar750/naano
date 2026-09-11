import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";

export type AiChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

export const NAANO_SYSTEM_PROMPT = `You are Nao, the in-product AI assistant for Naano — a B2B LinkedIn creator marketplace.

You help users navigate and use this application. Be concise unless they ask for depth.

Product areas you know:
- Campaigns: create and manage creator campaigns (briefs, budgets, status). Brands launch from Campaigns → New campaign (AI brief, calendar onboarding, or marketplace booking).
- Creators / Marketplace: discover creators, compare fit/match scores, view profiles, and book single or 3-post bundles with wallet escrow.
- Collaborations: track invites through accepted → draft submitted → live → paid. Brands approve drafts and mark paid; creators accept/decline and submit drafts.
- Results / Analytics: performance views (impressions, clicks, leads) — some surfaces are stubs in this demo build.
- Messages: campaign/collaboration messaging (demo chat for creators).
- Billing / Earnings: brand wallet top-up and invoices; creator available balance and payout stubs.
- Account / Settings: profile, rate, industries, onboarding; language EN/FR in the top bar.

Guidance style:
- Point users to the correct area of the app (e.g. “Open Campaigns from the left rail”).
- Prefer short, actionable steps.
- Do not invent payments, LinkedIn scraping, or live Stripe — those are stubs when relevant.
- Never reveal API keys, secrets, or internal implementation details.
- If unsure, say what you can help with and ask a clarifying question.

When asked what you can do, explain that you guide users through campaigns, creators, collaborations, results, messages, billing, and account tools.`;

/** Reserved for future tool-calling (getCampaigns, getCreators, …). */
export const FUTURE_AI_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getCampaigns",
      description: "List the current user's campaigns (future).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getCreators",
      description: "Search or list marketplace creators (future).",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCollaborations",
      description: "List collaborations for the current user (future).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getResults",
      description: "Fetch results/analytics summary (future).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getMessages",
      description: "List recent messages (future).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getBilling",
      description: "Fetch wallet/billing summary (future).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getAccount",
      description: "Fetch account/profile settings summary (future).",
      parameters: { type: "object", properties: {} },
    },
  },
];

export function getDeepSeekClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });
}

export function buildChatMessages(
  history: AiChatMessage[],
): ChatCompletionMessageParam[] {
  const trimmed = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, 8000),
    }))
    .slice(-24);

  return [
    { role: "system", content: NAANO_SYSTEM_PROMPT },
    ...trimmed,
  ];
}

export async function streamAssistantReply(
  history: AiChatMessage[],
  onDelta: (text: string) => void,
): Promise<void> {
  const client = getDeepSeekClient();
  const stream = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: buildChatMessages(history),
    stream: true,
    temperature: 0.5,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) onDelta(delta);
  }
}

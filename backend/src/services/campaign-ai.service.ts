import { getDeepSeekClient } from "./ai.service.js";
import { scrapeWebsite } from "./website-analyze.service.js";

export type CampaignAiDraft = {
  title: string;
  destinationUrl: string;
  icp: string;
  oneClaim: string;
  mustNots: string;
};

export type CampaignLinkRecoverResult = {
  draft: CampaignAiDraft;
  /** true when scrape/AI could not produce a usable brief */
  partial: boolean;
  notice: string | null;
};

const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

function ensureHttpUrl(url: string, fallback: string): string {
  const t = url.trim();
  if (!t) return fallback;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function isLinkedInHost(url: string): boolean {
  try {
    const host = new URL(ensureHttpUrl(url, "https://example.com")).hostname
      .replace(/^www\./i, "")
      .toLowerCase();
    return (
      host === "linkedin.com" ||
      host.endsWith(".linkedin.com") ||
      host === "lnkd.in"
    );
  } catch {
    return /linkedin\.com|lnkd\.in/i.test(url);
  }
}

function emptyManualDraft(destinationHint: string): CampaignAiDraft {
  return {
    title: "",
    destinationUrl: destinationHint || "https://",
    icp: "",
    oneClaim: "",
    mustNots:
      "No unsubstantiated claims. No competitor bashing. Keep it professional.",
  };
}

function fallbackDraft(
  prompt: string,
  companyWebsite: string | null | undefined,
): CampaignAiDraft {
  const title =
    prompt.trim().slice(0, 60).replace(/\s+/g, " ") || "Untitled campaign";
  return {
    title,
    destinationUrl: companyWebsite?.trim() || "https://",
    icp: prompt.trim().slice(0, 280) || "B2B decision-makers on LinkedIn",
    oneClaim: `Reach ${title} with a clear LinkedIn creator campaign.`,
    mustNots:
      "No unsubstantiated claims. No competitor bashing. Keep it professional.",
  };
}

/** Ask DeepSeek for a structured campaign brief draft. */
export async function draftCampaignBrief(input: {
  prompt: string;
  company?: string | null;
  website?: string | null;
  valueProp?: string | null;
}): Promise<CampaignAiDraft> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    return fallbackDraft("New campaign", input.website);
  }

  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    return fallbackDraft(prompt, input.website);
  }

  try {
    const client = getDeepSeekClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `You draft LinkedIn B2B creator campaign briefs.
Return ONLY valid JSON:
{
  "title": "short campaign title",
  "destinationUrl": "https://landing-page for tracking clicks (not LinkedIn)",
  "icp": "1-3 sentences describing ideal customer / audience",
  "oneClaim": "single sharp message creators should land",
  "mustNots": "guardrails creators must avoid (semicolon or sentence list)"
}
Rules:
- Ground the draft in the user's prompt and company context.
- destinationUrl must be an http(s) URL; prefer the company website if provided.
- Do not mention Naano or invent fake metrics.
- No markdown fences.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            prompt,
            company: input.company ?? null,
            website: input.website ?? null,
            valueProp: input.valueProp ?? null,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = parseJsonObject(raw);
    if (!parsed) return fallbackDraft(prompt, input.website);

    const title = asString(parsed.title, prompt.slice(0, 60));
    let destinationUrl = asString(
      parsed.destinationUrl,
      input.website?.trim() || "https://",
    );
    destinationUrl = ensureHttpUrl(
      destinationUrl,
      input.website?.trim() || "https://",
    );

    return {
      title: title.slice(0, 120),
      destinationUrl,
      icp: asString(parsed.icp, prompt).slice(0, 800),
      oneClaim: asString(
        parsed.oneClaim,
        `Reach ${title} with a clear LinkedIn creator campaign.`,
      ).slice(0, 500),
      mustNots: asString(
        parsed.mustNots,
        "No unsubstantiated claims. No competitor bashing. Keep it professional.",
      ).slice(0, 500),
    };
  } catch {
    return fallbackDraft(prompt, input.website);
  }
}

function draftLooksUsable(draft: CampaignAiDraft): boolean {
  return Boolean(
    draft.title.trim().length >= 3 &&
      draft.icp.trim().length >= 12 &&
      draft.oneClaim.trim().length >= 8 &&
      /^https?:\/\//i.test(draft.destinationUrl) &&
      !isLinkedInHost(draft.destinationUrl),
  );
}

/**
 * Fetch a public brief / campaign URL and recover structured draft fields.
 * On failure returns empty editable fields + a clear notice (no junk filler).
 */
export async function recoverCampaignFromLink(input: {
  sourceUrl: string;
  company?: string | null;
  website?: string | null;
  valueProp?: string | null;
}): Promise<CampaignLinkRecoverResult> {
  const sourceUrl = ensureHttpUrl(input.sourceUrl.trim(), "");
  const websiteHint = input.website?.trim() || "https://";

  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    return {
      draft: emptyManualDraft(websiteHint),
      partial: true,
      notice:
        "That does not look like a valid URL. Paste a public brief link, or fill the fields yourself.",
    };
  }

  if (isLinkedInHost(sourceUrl)) {
    return {
      draft: emptyManualDraft(websiteHint),
      partial: true,
      notice:
        "LinkedIn profile or post links are not campaign briefs. Paste a Notion, Docs, or public brief URL — or fill the fields yourself.",
    };
  }

  let scrapeText = "";
  let scrapeTitle = "";
  let scrapeUrl = sourceUrl;
  try {
    const scrape = await scrapeWebsite(sourceUrl);
    scrapeText = scrape.text;
    scrapeTitle = scrape.title;
    scrapeUrl = scrape.url || sourceUrl;
    if (!scrapeText || scrapeText.length < 80) {
      return {
        draft: emptyManualDraft(websiteHint),
        partial: true,
        notice:
          "I could not fully read that page. Fill in the brief yourself — use your product landing page as the destination URL.",
      };
    }
  } catch {
    return {
      draft: emptyManualDraft(websiteHint),
      partial: true,
      notice:
        "I could not fetch that page. Check the link is public, or fill the fields yourself.",
    };
  }

  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    const title =
      scrapeTitle && !/^http/i.test(scrapeTitle)
        ? scrapeTitle.slice(0, 120)
        : "";
    return {
      draft: {
        title,
        destinationUrl: websiteHint,
        icp: "",
        oneClaim: "",
        mustNots:
          "No unsubstantiated claims. No competitor bashing. Keep it professional.",
      },
      partial: true,
      notice:
        "I fetched the page but could not structure a full brief automatically. Complete the empty fields yourself.",
    };
  }

  try {
    const client = getDeepSeekClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You recover a LinkedIn B2B creator campaign brief from a scraped public page (Notion, docs, old campaign, landing page).
Return ONLY valid JSON:
{
  "usable": true,
  "title": "short campaign title",
  "destinationUrl": "https://product-or-signup landing page (NOT LinkedIn, NOT the source brief URL unless it is clearly a product site)",
  "icp": "ideal customer / audience",
  "oneClaim": "single sharp message",
  "mustNots": "guardrails"
}
Rules:
- usable=false if the page is unrelated, empty, a personal profile, paywall, or has no campaign/brief content.
- When usable=false, still return empty strings for title/icp/oneClaim and destinationUrl as the company website if provided.
- destinationUrl must never be linkedin.com.
- Do not invent metrics. No markdown fences.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceUrl: scrapeUrl,
            company: input.company ?? null,
            website: input.website ?? null,
            valueProp: input.valueProp ?? null,
            pageTitle: scrapeTitle,
            excerpt: scrapeText.slice(0, 9000),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = parseJsonObject(raw);
    if (!parsed || parsed.usable === false) {
      return {
        draft: emptyManualDraft(websiteHint),
        partial: true,
        notice:
          "I could not recover a campaign brief from that page. Fill in the fields yourself.",
      };
    }

    let destinationUrl = ensureHttpUrl(
      asString(parsed.destinationUrl, websiteHint),
      websiteHint,
    );
    if (isLinkedInHost(destinationUrl)) {
      destinationUrl = websiteHint;
    }

    const draft: CampaignAiDraft = {
      title: asString(parsed.title).slice(0, 120),
      destinationUrl,
      icp: asString(parsed.icp).slice(0, 800),
      oneClaim: asString(parsed.oneClaim).slice(0, 500),
      mustNots: asString(
        parsed.mustNots,
        "No unsubstantiated claims. No competitor bashing. Keep it professional.",
      ).slice(0, 500),
    };

    if (!draftLooksUsable(draft)) {
      return {
        draft: {
          ...emptyManualDraft(
            destinationUrl !== "https://" ? destinationUrl : websiteHint,
          ),
          title: draft.title,
          mustNots: draft.mustNots,
        },
        partial: true,
        notice:
          "I could not fully read that page. Fill in the rest of the brief yourself.",
      };
    }

    return {
      draft,
      partial: false,
      notice: null,
    };
  } catch {
    return {
      draft: emptyManualDraft(websiteHint),
      partial: true,
      notice: "I could not fully read that page. Fill in the brief yourself.",
    };
  }
}

export function composeBriefFromDraft(draft: CampaignAiDraft): string {
  return [
    `Destination URL: ${draft.destinationUrl}`,
    "",
    `ICP: ${draft.icp}`,
    "",
    `One claim: ${draft.oneClaim}`,
    "",
    `Must nots: ${draft.mustNots}`,
  ].join("\n");
}

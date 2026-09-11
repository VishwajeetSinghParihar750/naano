import { getDeepSeekClient } from "./ai.service.js";

export type IcpItem = {
  title: string;
  description: string;
};

export type WebsiteScrape = {
  url: string;
  host: string;
  title: string;
  description: string;
  text: string;
  faviconUrl: string | null;
};

export type WebsiteAnalysis = {
  company: string;
  valueProp: string;
  icp: IcpItem[];
  scrape: WebsiteScrape;
};

const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_CHARS = 400_000;
const MAX_TEXT_CHARS = 12_000;

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function metaContent(html: string, names: string[]): string {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,
      "i",
    );
    const m = html.match(re);
    const val = (m?.[1] || m?.[2] || "").trim();
    if (val) return decodeEntities(val);
  }
  return "";
}

function titleFromHtml(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].replace(/\s+/g, " ").trim()) : "";
}

function faviconFromHtml(html: string, baseUrl: string): string | null {
  const m = html.match(
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["'][^>]*>|<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["'][^>]*>/i,
  );
  const href = (m?.[1] || m?.[2] || "").trim();
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function headingSnippets(html: string): string {
  const bits: string[] = [];
  const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && bits.length < 12) {
    const t = stripTags(m[1]);
    if (t && t.length > 2) bits.push(t);
  }
  return bits.join(" | ");
}

export async function scrapeWebsite(websiteUrl: string): Promise<WebsiteScrape> {
  const url = websiteUrl.trim();
  const host = hostnameFromUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html = "";
  let finalUrl = url;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NaanoOnboardingBot/1.0; +https://naano.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    finalUrl = res.url || url;
    if (!res.ok) {
      throw new Error(`Website returned HTTP ${res.status}`);
    }
    const raw = await res.text();
    html = raw.slice(0, MAX_HTML_CHARS);
  } finally {
    clearTimeout(timer);
  }

  const title = titleFromHtml(html);
  const description =
    metaContent(html, [
      "description",
      "og:description",
      "twitter:description",
    ]) || "";
  const ogTitle = metaContent(html, ["og:title", "twitter:title"]);
  const headings = headingSnippets(html);
  const body = stripTags(html).slice(0, MAX_TEXT_CHARS);
  const text = [
    ogTitle || title,
    description,
    headings,
    body,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_TEXT_CHARS);

  return {
    url: finalUrl,
    host,
    title: ogTitle || title || host,
    description,
    text: text || `Company website: ${host}`,
    faviconUrl:
      faviconFromHtml(html, finalUrl) ||
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
  };
}

function fallbackAnalysis(
  scrape: WebsiteScrape,
  existingCompany: string,
): WebsiteAnalysis {
  const stem = scrape.host.split(".")[0] ?? scrape.host;
  const company =
    existingCompany?.trim().length > 1
      ? existingCompany.trim()
      : scrape.title.split(/[|\-–—]/)[0]?.trim() ||
        (stem ? stem.charAt(0).toUpperCase() + stem.slice(1) : scrape.host);

  const valueProp =
    scrape.description ||
    `${company} (${scrape.host}): ${scrape.text.slice(0, 420)}`;

  const icp: IcpItem[] = [
    {
      title: "Primary buyer",
      description: `Decision-maker evaluating ${company} based on public positioning at ${scrape.host}.`,
    },
    {
      title: "Champion / operator",
      description: `Day-to-day owner who would use or advocate for ${company}'s product or service.`,
    },
    {
      title: "Economic stakeholder",
      description: `Budget owner focused on outcomes described on ${scrape.host}.`,
    },
  ];

  return { company, valueProp, icp, scrape };
}

function parseAnalysisJson(raw: string): {
  company?: string;
  valueProp?: string;
  icp?: IcpItem[];
} | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as {
      company?: string;
      valueProp?: string;
      icp?: IcpItem[];
    };
  } catch {
    return null;
  }
}

async function summarizeWithDeepSeek(
  scrape: WebsiteScrape,
  existingCompany: string,
): Promise<WebsiteAnalysis | null> {
  if (!process.env.DEEPSEEK_API_KEY?.trim()) return null;

  const client = getDeepSeekClient();
  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You analyze a company's public website for B2B go-to-market onboarding.
Return ONLY valid JSON with this shape:
{
  "company": "short company or product name",
  "valueProp": "2-4 sentences describing what THIS company sells/offers and for whom, grounded in the site content. Do not mention Naano, LinkedIn marketplaces, creator platforms, or any third-party product.",
  "icp": [
    { "title": "role or persona", "description": "1-2 sentences about why they buy from THIS company" },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}
Rules:
- Base everything on the provided website text.
- Exactly 3 ICP entries.
- No markdown fences.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          websiteUrl: scrape.url,
          host: scrape.host,
          existingCompany: existingCompany || null,
          title: scrape.title,
          description: scrape.description,
          excerpt: scrape.text.slice(0, 9000),
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  const parsed = parseAnalysisJson(raw);
  if (!parsed?.valueProp || !Array.isArray(parsed.icp) || parsed.icp.length < 1) {
    return null;
  }

  const icp = parsed.icp.slice(0, 3).map((item) => ({
    title: String(item.title || "Buyer").slice(0, 80),
    description: String(item.description || "").slice(0, 500),
  }));
  while (icp.length < 3) {
    icp.push({
      title: `Persona ${icp.length + 1}`,
      description: `Relevant buyer for ${parsed.company || scrape.host}.`,
    });
  }

  return {
    company: (parsed.company || existingCompany || scrape.title).trim(),
    valueProp: parsed.valueProp.trim(),
    icp,
    scrape,
  };
}

/** Fetch the public site, then summarize into value prop + ICP. */
export async function analyzeCompanyWebsite(
  websiteUrl: string,
  existingCompany: string,
): Promise<WebsiteAnalysis> {
  const scrape = await scrapeWebsite(websiteUrl);
  try {
    const ai = await summarizeWithDeepSeek(scrape, existingCompany);
    if (ai) return ai;
  } catch {
    /* fall through to scrape-only summary */
  }
  return fallbackAnalysis(scrape, existingCompany);
}

import { getDeepSeekClient } from "./ai.service.js";

export type LinkedInScrape = {
  url: string;
  slug: string;
  title: string;
  description: string;
  text: string;
};

export type LinkedInProfileAnalysis = {
  name: string;
  headline: string;
  country: string;
  followers: number;
  niche: string;
  bio: string | null;
  scrape: LinkedInScrape;
};

export type LinkedInAnalyzeResult = {
  analysis: LinkedInProfileAnalysis;
  partial: boolean;
  notice: string | null;
};

const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_CHARS = 400_000;
const MAX_TEXT_CHARS = 10_000;

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

/** Accept linkedin.com/in/... URLs (with or without protocol / www). */
export function normalizeLinkedInProfileUrl(raw: string): string {
  let input = raw.trim();
  if (!input) throw new Error("LinkedIn URL is required.");
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`;

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("Enter a valid LinkedIn profile URL.");
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "linkedin.com" && host !== "lnkd.in") {
    throw new Error("URL must be a linkedin.com profile link.");
  }

  // Expand short links only by keeping origin; /in/ path required after redirects.
  const path = parsed.pathname.replace(/\/+/g, "/");
  const inMatch = path.match(/\/in\/([^/?#]+)/i);
  if (!inMatch) {
    throw new Error(
      "Use a public profile URL like https://www.linkedin.com/in/your-handle",
    );
  }

  const slug = decodeURIComponent(inMatch[1]).replace(/\/$/, "");
  return `https://www.linkedin.com/in/${encodeURIComponent(slug)}`;
}

function slugFromUrl(url: string): string {
  try {
    const m = new URL(url).pathname.match(/\/in\/([^/?#]+)/i);
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}

function nameFromSlug(slug: string): string {
  const cleaned = slug
    .replace(/-+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Creator";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Parse "12,345 followers", "12.3K followers", "1.2M Followers". */
export function parseFollowerCount(text: string): number | null {
  const patterns = [
    /([\d.,]+)\s*([KkMm])?\+?\s*followers/i,
    /followers["'\s:]+([\d.,]+)\s*([KkMm])?/i,
    /"followerCount"\s*:\s*(\d+)/i,
    /"follower_count"\s*:\s*(\d+)/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    if (re.source.includes("followerCount") || re.source.includes("follower_count")) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0) return Math.round(n);
      continue;
    }
    const raw = (m[1] || "").replace(/,/g, "");
    const suffix = (m[2] || "").toUpperCase();
    let n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (suffix === "K") n *= 1_000;
    if (suffix === "M") n *= 1_000_000;
    return Math.round(n);
  }
  return null;
}

async function fetchHtml(url: string): Promise<{ finalUrl: string; html: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });
    const finalUrl = res.url || url;
    if (!res.ok) {
      throw new Error(`LinkedIn returned HTTP ${res.status}`);
    }
    const raw = await res.text();
    return { finalUrl, html: raw.slice(0, MAX_HTML_CHARS) };
  } finally {
    clearTimeout(timer);
  }
}

export async function scrapeLinkedInProfile(
  linkedinUrl: string,
): Promise<LinkedInScrape> {
  const url = normalizeLinkedInProfileUrl(linkedinUrl);
  const { finalUrl, html } = await fetchHtml(url);
  const normalizedFinal = (() => {
    try {
      return normalizeLinkedInProfileUrl(finalUrl);
    } catch {
      return url;
    }
  })();

  const title = titleFromHtml(html);
  const description =
    metaContent(html, [
      "description",
      "og:description",
      "twitter:description",
    ]) || "";
  const ogTitle = metaContent(html, ["og:title", "twitter:title"]);
  const body = stripTags(html).slice(0, MAX_TEXT_CHARS);
  const text = [ogTitle || title, description, body]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_TEXT_CHARS);

  const slug = slugFromUrl(normalizedFinal) || slugFromUrl(url);

  if (!text || text.length < 40) {
    throw new Error(
      "Could not read that LinkedIn profile. Make sure the URL is public and try again.",
    );
  }

  if (
    /sign in to linkedin|join linkedin|authwall|challenge\.linkedin|session_redirect/i.test(
      text,
    ) &&
    !parseFollowerCount(text) &&
    !/followers/i.test(description)
  ) {
    throw new Error(
      "LinkedIn blocked the public profile fetch (login wall). Open the profile in a private window to confirm it is public, then try again.",
    );
  }

  return {
    url: normalizedFinal,
    slug,
    title: ogTitle || title || slug,
    description,
    text,
  };
}

function fallbackAnalysis(scrape: LinkedInScrape): LinkedInProfileAnalysis {
  const followers = parseFollowerCount(`${scrape.description}\n${scrape.text}`) ?? 0;
  let name = nameFromSlug(scrape.slug);
  const titleBits = scrape.title.split(/[|\-–—•]/).map((s) => s.trim()).filter(Boolean);
  if (titleBits[0] && !/linkedin/i.test(titleBits[0])) {
    name = titleBits[0].replace(/\s*\(\d+.*$/, "").trim() || name;
  }
  const headline =
    scrape.description.split(/[.|•|·|\n]/)[0]?.trim().slice(0, 180) ||
    titleBits[1]?.slice(0, 180) ||
    "LinkedIn creator";

  return {
    name,
    headline,
    country: "",
    followers,
    niche: headline.slice(0, 80),
    bio: scrape.description.slice(0, 500) || null,
    scrape,
  };
}

function parseProfileJson(raw: string): {
  name?: string;
  headline?: string;
  country?: string;
  followers?: number;
  niche?: string;
  bio?: string | null;
} | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as {
      name?: string;
      headline?: string;
      country?: string;
      followers?: number;
      niche?: string;
      bio?: string | null;
    };
  } catch {
    return null;
  }
}

async function summarizeWithDeepSeek(
  scrape: LinkedInScrape,
): Promise<LinkedInProfileAnalysis | null> {
  if (!process.env.DEEPSEEK_API_KEY?.trim()) return null;

  const regexFollowers = parseFollowerCount(`${scrape.description}\n${scrape.text}`);
  const client = getDeepSeekClient();
  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You extract public LinkedIn creator profile fields from scraped page text.
Return ONLY valid JSON:
{
  "name": "full name",
  "headline": "professional headline",
  "country": "country if present else empty string",
  "followers": 12345,
  "niche": "short niche label",
  "bio": "1-2 sentence summary or null"
}
Rules:
- Use only the provided scrape text. Do not invent a famous person if the text is an auth wall.
- followers must be an integer >= 0. Prefer an explicit follower count in the text. If only K/M shorthand appears, expand it.
- If follower count is missing, set followers to 0.
- No markdown fences.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          profileUrl: scrape.url,
          slug: scrape.slug,
          title: scrape.title,
          description: scrape.description,
          regexFollowersHint: regexFollowers,
          excerpt: scrape.text.slice(0, 8000),
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  const parsed = parseProfileJson(raw);
  if (!parsed?.name || !parsed.headline) return null;

  const aiFollowers = Number(parsed.followers);
  const followers =
    Number.isFinite(aiFollowers) && aiFollowers > 0
      ? Math.round(aiFollowers)
      : regexFollowers ?? 0;

  return {
    name: String(parsed.name).trim().slice(0, 120),
    headline: String(parsed.headline).trim().slice(0, 240),
    country: String(parsed.country || "").trim().slice(0, 80),
    followers,
    niche: String(parsed.niche || parsed.headline).trim().slice(0, 80),
    bio:
      parsed.bio == null || parsed.bio === ""
        ? null
        : String(parsed.bio).trim().slice(0, 500),
    scrape,
  };
}

function stubAnalysis(linkedinUrl: string): LinkedInProfileAnalysis {
  const url = normalizeLinkedInProfileUrl(linkedinUrl);
  const slug = slugFromUrl(url);
  const name = nameFromSlug(slug);
  return {
    name,
    headline: "",
    country: "",
    followers: 0,
    niche: "",
    bio: null,
    scrape: {
      url,
      slug,
      title: name,
      description: "",
      text: "",
    },
  };
}

/** Fetch a public LinkedIn profile URL and extract creator card fields.
 * Never blocks signup on scrape failures — returns partial stub instead.
 */
export async function analyzeLinkedInProfile(
  linkedinUrl: string,
): Promise<LinkedInAnalyzeResult> {
  // Invalid URL format still throws (caller may map to 400).
  const normalized = normalizeLinkedInProfileUrl(linkedinUrl);

  try {
    const scrape = await scrapeLinkedInProfile(normalized);
    let analysis: LinkedInProfileAnalysis;
    try {
      const ai = await summarizeWithDeepSeek(scrape);
      analysis = ai ?? fallbackAnalysis(scrape);
    } catch {
      analysis = fallbackAnalysis(scrape);
    }

    const thin =
      analysis.followers <= 0 &&
      (!analysis.headline || analysis.headline === "LinkedIn creator");

    return {
      analysis,
      partial: thin,
      notice: thin
        ? "LinkedIn returned little public data. Continuing with what we have — you can refresh stats later in Settings."
        : null,
    };
  } catch (err) {
    const detail =
      err instanceof Error && err.message
        ? err.message
        : "Could not fetch that LinkedIn profile.";
    return {
      analysis: stubAnalysis(normalized),
      partial: true,
      notice: `${detail} Continuing with empty stats — refresh later in Settings.`,
    };
  }
}

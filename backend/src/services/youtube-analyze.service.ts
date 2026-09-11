/**
 * Fetch public YouTube channel stats (subscribers, videos, views, recent posts).
 * Prefers YouTube Data API v3 when YOUTUBE_API_KEY is set; otherwise scrapes
 * the public /about page and the channel RSS feed.
 */

export type YouTubeChannelAnalysis = {
  name: string;
  headline: string;
  followers: number;
  videoCount: number;
  viewCount: number;
  posts7d: number;
  posts90d: number;
  /** Average views per video — used as "Est. impressions" on the card. */
  estImpressions: number;
  niche: string;
  bio: string | null;
  channelUrl: string;
  channelId: string | null;
  handle: string | null;
};

export type YouTubeAnalyzeResult = {
  analysis: YouTubeChannelAnalysis;
  partial: boolean;
  notice: string | null;
};

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_CHARS = 8_000_000;
const INT32_MAX = 2_147_483_647;

function ensureHttpUrl(raw: string): string {
  const t = raw.trim();
  if (!t) throw new Error("YouTube channel URL is required.");
  if (/^[a-z][a-z0-9+.-]*:/i.test(t) && !/^https?:\/\//i.test(t)) {
    throw new Error("URL must use http or https.");
  }
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("@")) return `https://www.youtube.com/${t}`;
  return `https://${t}`;
}

export function normalizeYouTubeChannelUrl(raw: string): {
  url: string;
  channelId: string | null;
  handle: string | null;
} {
  const input = ensureHttpUrl(raw);
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("Enter a valid YouTube channel URL.");
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtu.be") {
    throw new Error("URL must be a youtube.com channel link.");
  }

  const path = parsed.pathname.replace(/\/+/g, "/");

  const channelMatch = path.match(/^\/channel\/([A-Za-z0-9_-]+)/i);
  if (channelMatch) {
    const channelId = channelMatch[1];
    return {
      url: `https://www.youtube.com/channel/${channelId}`,
      channelId,
      handle: null,
    };
  }

  const handleMatch = path.match(/^\/@([^/]+)/);
  if (handleMatch) {
    const handle = decodeURIComponent(handleMatch[1]).replace(/^@/, "");
    return {
      url: `https://www.youtube.com/@${handle}`,
      channelId: null,
      handle,
    };
  }

  const customMatch = path.match(/^\/(c|user)\/([^/]+)/i);
  if (customMatch) {
    const kind = customMatch[1].toLowerCase();
    const slug = decodeURIComponent(customMatch[2]);
    return {
      url: `https://www.youtube.com/${kind}/${slug}`,
      channelId: null,
      handle: kind === "user" ? slug : null,
    };
  }

  throw new Error(
    "Use a channel URL like https://www.youtube.com/@handle or /channel/UCxxxx",
  );
}

function clampInt(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n), INT32_MAX);
}

function parseAbbreviatedCount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  const m = cleaned.match(/^([\d.]+)\s*([KkMmBb])?$/);
  if (!m) {
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  }
  let n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const suffix = (m[2] || "").toUpperCase();
  if (suffix === "K") n *= 1_000;
  if (suffix === "M") n *= 1_000_000;
  if (suffix === "B") n *= 1_000_000_000;
  return Math.round(n);
}

/** Prefer the about-tab metadata block (joinedDateText) — most reliable. */
export function parseAboutChannelStats(text: string): {
  followers: number | null;
  viewCount: number | null;
} {
  const m = text.match(
    /"subscriberCountText"\s*:\s*"([^"]*subscribers?)"\s*,\s*"viewCountText"\s*:\s*"([^"]*views?)"\s*,\s*"joinedDateText"/i,
  );
  if (!m) return { followers: null, viewCount: null };
  const followers = parseSubscriberCount(m[1]);
  const viewsRaw = m[2].replace(/,/g, "").match(/([\d.]+)/);
  const viewCount = viewsRaw ? Number(viewsRaw[1]) : null;
  return {
    followers,
    viewCount:
      viewCount != null && Number.isFinite(viewCount) && viewCount >= 0
        ? Math.round(viewCount)
        : null,
  };
}

/** Parse "2.67M subscribers", "1.14 million subscribers", etc. */
export function parseSubscriberCount(text: string): number | null {
  const about = parseAboutChannelStats(text);
  if (about.followers != null) return about.followers;

  const compact = text.match(
    /"subscriberCountText"\s*:\s*"([\d.,]+\s*[KkMmBb]?)\s*subscribers?"/i,
  );
  if (compact) {
    const n = parseAbbreviatedCount(compact[1].replace(/\s+/g, ""));
    if (n != null) return n;
  }

  const simple = text.match(
    /"simpleText"\s*:\s*"([\d.,]+\s*[KkMmBb]?)\s*subscribers?"/i,
  );
  if (simple) {
    const n = parseAbbreviatedCount(simple[1].replace(/\s+/g, ""));
    if (n != null) return n;
  }

  const exact = text.match(/"subscriberCount"\s*:\s*"(\d+)"/);
  if (exact) {
    const n = Number(exact[1]);
    if (Number.isFinite(n) && n >= 0) return n;
  }

  const access = text.match(
    /"label"\s*:\s*"([\d.,]+\s*[KkMmBb]?)\s*(?:million\s+)?subscribers?"/i,
  );
  if (access) {
    const million = /million/i.test(access[0]);
    const inner = access[1].match(/([\d.,]+)\s*([KkMmBb])?/i);
    if (inner) {
      let n = parseAbbreviatedCount(`${inner[1]}${inner[2] || ""}`);
      if (n != null && million && !inner[2]) n *= 1_000_000;
      if (n != null) return n;
    }
  }

  const labeled = text.match(/([\d.,]+)\s*([KkMmBb])?\s*subscribers?/i);
  if (labeled) {
    return parseAbbreviatedCount(`${labeled[1]}${labeled[2] || ""}`);
  }

  return null;
}

export function parseViewCount(text: string): number | null {
  const about = parseAboutChannelStats(text);
  if (about.viewCount != null) return about.viewCount;

  const aboutStr = text.match(
    /"viewCountText"\s*:\s*"([\d,]+)\s*views?"/i,
  );
  if (aboutStr) {
    const n = Number(aboutStr[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 0) return n;
  }

  const exact = text.match(/"viewCount"\s*:\s*"(\d+)"/);
  if (exact) {
    const n = Number(exact[1]);
    if (Number.isFinite(n) && n >= 0) return n;
  }

  return null;
}

export function parseVideoCount(
  text: string,
  channelFollowers?: number | null,
): number | null {
  // Exact counts beat abbreviated chips ("6K videos").
  const about = text.match(
    /"videoCountText"\s*:\s*"([\d,]+)\s*videos?"/i,
  );
  if (about) {
    const n = Number(about[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 0) return n;
  }

  const exact = text.match(/"videoCount"\s*:\s*"(\d+)"/);
  if (exact) {
    const n = Number(exact[1]);
    if (Number.isFinite(n) && n >= 0) return n;
  }

  const plains = [...text.matchAll(/\b([\d,]{3,})\s*videos\b/g)].map((x) =>
    Number(x[1].replace(/,/g, "")),
  );
  const plainBest = plains
    .filter((n) => Number.isFinite(n) && n >= 10)
    .sort((a, b) => b - a)[0];
  if (plainBest != null) return plainBest;

  const content = text.match(
    /"content"\s*:\s*"([\d.,]+\s*[KkMmBb]?)\s*videos?"/i,
  );
  if (content) {
    const n = parseAbbreviatedCount(content[1].replace(/\s+/g, ""));
    if (n != null && n > 0) return n;
  }

  // runs + neighboring subscriberCountText — only when subs ≈ this channel
  const pairRe =
    /"videoCountText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([\d,]+)"\s*\}\s*,\s*\{\s*"text"\s*:\s*"\s*videos?"\s*\}\s*\]\s*\}\s*,\s*"subscriberCountText"\s*:\s*(?:"([^"]+)"|\{[^]*?"simpleText"\s*:\s*"([^"]+)")/gi;
  let m: RegExpExecArray | null;
  while ((m = pairRe.exec(text))) {
    const videos = Number(m[1].replace(/,/g, ""));
    const subsLabel = m[2] || m[3] || "";
    const subs = parseAbbreviatedCount(
      subsLabel.replace(/subscribers?/i, "").replace(/\s+/g, "").trim(),
    );
    if (!Number.isFinite(videos) || videos <= 0) continue;
    if (
      channelFollowers != null &&
      channelFollowers > 0 &&
      subs != null &&
      Math.abs(subs - channelFollowers) / channelFollowers <= 0.15
    ) {
      return Math.round(videos);
    }
  }

  return null;
}

function extractChannelId(html: string): string | null {
  // Prefer the about-metadata channel id (next to canonicalChannelUrl / joinedDate).
  const aboutId = html.match(
    /"joinedDateText"[\s\S]{0,240}?"channelId"\s*:\s*"(UC[\w-]+)"/,
  )?.[1];
  if (aboutId) return aboutId;
  const canonical = html.match(
    /"canonicalChannelUrl"\s*:\s*"[^"]+"\s*,\s*"channelId"\s*:\s*"(UC[\w-]+)"/,
  )?.[1];
  if (canonical) return canonical;
  return html.match(/"channelId"\s*:\s*"(UC[\w-]+)"/)?.[1] ?? null;
}

function decodeYtString(s: string): string {
  return s
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

async function fetchText(url: string): Promise<string> {
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
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`YouTube returned HTTP ${res.status}`);
    }
    return (await res.text()).slice(0, MAX_HTML_CHARS);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRecentPostCounts(channelId: string): Promise<{
  posts7d: number;
  posts90d: number;
}> {
  try {
    const xml = await fetchText(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
    );
    if (!xml.includes("<published>") || !xml.includes("<feed")) {
      return { posts7d: 0, posts90d: 0 };
    }
    const published = [...xml.matchAll(/<published>([^<]+)<\/published>/g)].map(
      (m) => Date.parse(m[1]),
    );
    const now = Date.now();
    const posts7d = published.filter(
      (t) => Number.isFinite(t) && now - t <= 7 * 86_400_000 && now - t >= 0,
    ).length;
    const posts90d = published.filter(
      (t) => Number.isFinite(t) && now - t <= 90 * 86_400_000 && now - t >= 0,
    ).length;
    return { posts7d, posts90d };
  } catch {
    return { posts7d: 0, posts90d: 0 };
  }
}

function withDerived(
  base: Omit<YouTubeChannelAnalysis, "estImpressions" | "posts7d" | "posts90d"> & {
    posts7d?: number;
    posts90d?: number;
  },
): YouTubeChannelAnalysis {
  const videoCount = clampInt(base.videoCount);
  const rawViews = Number.isFinite(base.viewCount) ? Math.max(0, base.viewCount) : 0;
  // Compute avg before clamping total views (large channels exceed Int32).
  const estImpressions =
    videoCount > 0 ? clampInt(rawViews / videoCount) : 0;
  return {
    ...base,
    followers: clampInt(base.followers),
    videoCount,
    viewCount: clampInt(rawViews),
    posts7d: clampInt(base.posts7d ?? 0),
    posts90d: clampInt(base.posts90d ?? 0),
    estImpressions,
  };
}

async function fetchViaDataApi(input: {
  channelId: string | null;
  handle: string | null;
}): Promise<YouTubeChannelAnalysis | null> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return null;

  const params = new URLSearchParams({
    part: "snippet,statistics",
    key,
  });
  if (input.channelId) params.set("id", input.channelId);
  else if (input.handle) params.set("forHandle", input.handle);
  else return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params}`,
      { signal: controller.signal },
    );
    if (!res.ok) {
      throw new Error(`YouTube API HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      items?: Array<{
        id: string;
        snippet?: {
          title?: string;
          description?: string;
          customUrl?: string;
        };
        statistics?: {
          subscriberCount?: string;
          hiddenSubscriberCount?: boolean;
          videoCount?: string;
          viewCount?: string;
        };
      }>;
    };
    const item = json.items?.[0];
    if (!item) return null;

    const name = item.snippet?.title?.trim() || "YouTube creator";
    const description = item.snippet?.description?.trim() || "";
    const headline =
      description.split(/\n+/)[0]?.trim().slice(0, 240) ||
      "YouTube creator";
    const hidden = Boolean(item.statistics?.hiddenSubscriberCount);
    const followers = hidden
      ? 0
      : Number(item.statistics?.subscriberCount || 0) || 0;
    const videoCount = Number(item.statistics?.videoCount || 0) || 0;
    const viewCount = Number(item.statistics?.viewCount || 0) || 0;
    const handle =
      input.handle ||
      item.snippet?.customUrl?.replace(/^@/, "") ||
      null;
    const channelUrl = handle
      ? `https://www.youtube.com/@${handle}`
      : `https://www.youtube.com/channel/${item.id}`;

    const recent = await fetchRecentPostCounts(item.id);

    return withDerived({
      name,
      headline,
      followers,
      videoCount,
      viewCount,
      niche: headline.slice(0, 80),
      bio: description.slice(0, 500) || null,
      channelUrl,
      channelId: item.id,
      handle,
      ...recent,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchViaPublicPage(
  normalized: ReturnType<typeof normalizeYouTubeChannelUrl>,
): Promise<YouTubeChannelAnalysis> {
  // /about carries subscriberCountText, viewCountText, videoCountText reliably.
  const aboutUrl = `${normalized.url.replace(/\/$/, "")}/about`;
  let html: string;
  try {
    html = await fetchText(aboutUrl);
  } catch {
    html = await fetchText(normalized.url);
  }

  // If about page is thin, merge in the main channel page.
  if (!parseSubscriberCount(html)) {
    try {
      const main = await fetchText(normalized.url);
      html = `${html}\n${main}`;
    } catch {
      /* keep about html */
    }
  }

  const followers = parseSubscriberCount(html) ?? 0;
  const viewCount = parseViewCount(html) ?? 0;
  const videoCount = parseVideoCount(html, followers) ?? 0;

  let name =
    html.match(/"ownerChannelName"\s*:\s*"([^"]+)"/)?.[1] ||
    html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    )?.[1] ||
    html
      .match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      ?.replace(/\s*-\s*YouTube\s*$/i, "") ||
    normalized.handle ||
    "YouTube creator";
  name = decodeYtString(name);

  const ogDesc =
    html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    )?.[1] || "";
  const decodedDesc = decodeYtString(ogDesc);
  const headline =
    decodedDesc.split(/[.!\n]/)[0]?.trim().slice(0, 240) ||
    "YouTube creator";

  const channelId =
    normalized.channelId || extractChannelId(html) || null;

  const recent = channelId
    ? await fetchRecentPostCounts(channelId)
    : { posts7d: 0, posts90d: videoCount > 0 ? Math.min(videoCount, 15) : 0 };

  if (!name && !followers && !videoCount) {
    throw new Error("Could not read public stats for that channel.");
  }

  return withDerived({
    name: name.slice(0, 120) || "YouTube creator",
    headline,
    followers,
    videoCount,
    viewCount,
    niche: headline.slice(0, 80),
    bio: decodedDesc.slice(0, 500) || null,
    channelUrl: normalized.url,
    channelId,
    handle: normalized.handle,
    ...recent,
  });
}

function stubAnalysis(
  normalized: ReturnType<typeof normalizeYouTubeChannelUrl>,
): YouTubeChannelAnalysis {
  const name = normalized.handle
    ? normalized.handle.replace(/[-_]+/g, " ")
    : "YouTube creator";
  return withDerived({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    headline: "",
    followers: 0,
    videoCount: 0,
    viewCount: 0,
    niche: "",
    bio: null,
    channelUrl: normalized.url,
    channelId: normalized.channelId,
    handle: normalized.handle,
    posts7d: 0,
    posts90d: 0,
  });
}

/** Resolve a YouTube channel URL into creator card fields. Soft-fails to zeros. */
export async function analyzeYouTubeChannel(
  youtubeUrl: string,
): Promise<YouTubeAnalyzeResult> {
  const normalized = normalizeYouTubeChannelUrl(youtubeUrl);

  try {
    const fromApi = await fetchViaDataApi({
      channelId: normalized.channelId,
      handle: normalized.handle,
    });
    if (fromApi && (fromApi.followers > 0 || fromApi.name)) {
      const weak =
        fromApi.followers <= 0 ||
        (fromApi.videoCount <= 0 && fromApi.viewCount <= 0);
      return {
        analysis: fromApi,
        partial: weak,
        notice: weak
          ? "Channel found, but some public stats were hidden. You can refresh later in Settings."
          : null,
      };
    }
  } catch {
    /* try public page */
  }

  try {
    const fromPage = await fetchViaPublicPage(normalized);
    const weak =
      fromPage.followers <= 0 ||
      (fromPage.videoCount <= 0 && fromPage.viewCount <= 0);
    return {
      analysis: fromPage,
      partial: fromPage.followers <= 0,
      notice: weak
        ? fromPage.followers <= 0
          ? "Imported the channel, but subscribers were hidden or missing."
          : "Imported subscribers; video/view stats were incomplete."
        : null,
    };
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "Could not fetch that YouTube channel.";
    return {
      analysis: stubAnalysis(normalized),
      partial: true,
      notice: `${detail} Continuing with empty stats — refresh later in Settings.`,
    };
  }
}

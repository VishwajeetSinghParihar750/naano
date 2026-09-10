import { tourById, tours, type Tour } from "../lib/tours.js";

export type GuideMatch = {
  tourId: string;
  caption: string;
  route: string;
};

function toMatch(tour: Tour, caption?: string): GuideMatch {
  return {
    tourId: tour.id,
    caption: caption ?? tour.caption,
    route: tour.route,
  };
}

function scoreKeywords(question: string): Tour | null {
  const q = question.toLowerCase();
  let best: Tour | null = null;
  let bestScore = 0;

  for (const tour of tours) {
    let score = 0;
    for (const keyword of tour.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        score += keyword.includes(" ") ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = tour;
    }
  }

  return bestScore > 0 ? best : null;
}

function defaultMatch(question: string): GuideMatch {
  const q = question.toLowerCase();
  const pricingHints = ["price", "pricing", "cost", "€", "euro", "plan", "paid"];
  if (pricingHints.some((h) => q.includes(h))) {
    const tour = tourById("marketing-pricing")!;
    return toMatch(
      tour,
      "Not sure what you meant — here's pricing: Self-Serve is free; Managed is €700/mo.",
    );
  }
  const tour = tourById("auth-demo")!;
  return toMatch(
    tour,
    "Not sure what you meant — try Demo as creator or Demo as brand to explore.",
  );
}

type LlmPick = {
  tourId?: string;
  caption?: string;
};

async function matchWithOpenAi(question: string): Promise<GuideMatch | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const catalog = tours.map((t) => ({
    id: t.id,
    route: t.route,
    caption: t.caption,
  }));

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You pick the best product tour stop for a user question. Reply ONLY with JSON: {\"tourId\":\"...\",\"caption\":\"...\"}. tourId must be one of the provided ids. caption should be a short helpful tip (you may reuse or lightly adapt the tour caption).",
          },
          {
            role: "user",
            content: JSON.stringify({ question, tours: catalog }),
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as LlmPick;
    if (!parsed.tourId) return null;
    const tour = tourById(parsed.tourId);
    if (!tour) return null;

    return toMatch(
      tour,
      typeof parsed.caption === "string" && parsed.caption.trim()
        ? parsed.caption.trim()
        : tour.caption,
    );
  } catch {
    return null;
  }
}

export async function matchTour(question: string): Promise<GuideMatch> {
  const keywordWinner = scoreKeywords(question);

  if (process.env.OPENAI_API_KEY) {
    const llm = await matchWithOpenAi(question);
    if (llm) return llm;
  }

  if (keywordWinner) return toMatch(keywordWinner);
  return defaultMatch(question);
}

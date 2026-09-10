export type Tour = {
  id: string;
  route: string;
  caption: string;
  keywords: string[];
};

export const tours: Tour[] = [
  {
    id: "creator-card",
    route: "/creator/card",
    caption: "Your marketplace card and €/post rate live here.",
    keywords: [
      "rate",
      "card",
      "profile",
      "marketplace card",
      "publish",
      "headline",
      "niche",
      "€/post",
      "per post",
      "set my rate",
      "creator card",
    ],
  },
  {
    id: "creator-opportunities",
    route: "/creator/opportunities",
    caption: "Invites from brands show up here — accept or decline.",
    keywords: [
      "invite",
      "invites",
      "opportunity",
      "opportunities",
      "accept",
      "decline",
      "brand invite",
    ],
  },
  {
    id: "creator-collaborations",
    route: "/creator/collaborations",
    caption: "Track booked work and submit drafts here.",
    keywords: [
      "draft",
      "drafts",
      "submit",
      "booked",
      "collaboration",
      "collaborations",
      "deliverable",
      "creator collaboration",
    ],
  },
  {
    id: "brand-marketplace",
    route: "/brand/marketplace",
    caption: "Browse creators and invite them to a campaign.",
    keywords: [
      "browse",
      "find creator",
      "find creators",
      "marketplace",
      "invite creator",
      "invite them",
      "discover",
    ],
  },
  {
    id: "brand-campaigns",
    route: "/brand/campaigns",
    caption: "Create and manage campaign briefs here.",
    keywords: [
      "campaign",
      "campaigns",
      "brief",
      "briefs",
      "create campaign",
      "manage campaign",
    ],
  },
  {
    id: "brand-collaborations",
    route: "/brand/collaborations",
    caption: "Approve drafts and mark collaborations paid here.",
    keywords: [
      "approve",
      "paid",
      "payment",
      "mark paid",
      "brand collaboration",
      "approve draft",
    ],
  },
  {
    id: "marketing-pricing",
    route: "/pricing",
    caption: "Self-Serve is free; Managed is €700/mo.",
    keywords: [
      "pricing",
      "price",
      "cost",
      "€700",
      "700",
      "self-serve",
      "self serve",
      "managed",
      "subscription",
      "plan",
      "plans",
      "how much",
    ],
  },
  {
    id: "auth-demo",
    route: "/login",
    caption: "Use Demo as creator or Demo as brand to explore both sides.",
    keywords: [
      "demo",
      "login",
      "sign in",
      "try",
      "explore",
      "demo as",
      "test account",
    ],
  },
];

export function tourById(id: string): Tour | undefined {
  return tours.find((t) => t.id === id);
}

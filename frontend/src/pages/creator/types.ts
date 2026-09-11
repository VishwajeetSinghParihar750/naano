export const INDUSTRIES = [
  "B2B",
  "B2C",
  "AI",
  "SaaS",
  "Software",
  "Sales",
  "Marketing",
  "SEO",
  "Outreach",
  "CRM",
  "Creative",
  "Productivity",
  "Fintech",
  "HealthTech",
  "EdTech",
  "Cybersecurity",
  "Growth/GTM",
  "HR",
  "E-commerce",
  "Developer Tools",
  "Data/Analytics",
  "Customer Support",
  "Design",
  "Real Estate/PropTech",
  "LegalTech",
] as const;

export type CollaborationStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "draft_submitted"
  | "live"
  | "paid";

export type CreatorDealMeta = {
  creatorShare: number;
  rewardMonths: number;
  followersGate: number;
};

export type CreatorProfile = {
  id: string;
  name: string;
  headline: string;
  niche: string;
  country: string;
  followers: number;
  videoCount?: number;
  viewCount?: number;
  posts7d?: number;
  posts90d?: number;
  estImpressions?: number;
  ratePerPostCents: number;
  cardPublished: boolean;
  bio?: string | null;
  avatarUrl?: string | null;
  industries: string[];
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
  cardSlug: string;
  onboardingComplete: boolean;
  registrationCountry?: string | null;
  isRegisteredBusiness?: boolean | null;
  legalName?: string | null;
  legalAddress?: string | null;
  taxSelfDeclared: boolean;
  invoiceAuthorized: boolean;
  bankDetails?: {
    accountHolder?: string;
    iban?: string;
    bankName?: string;
  } | null;
  deal?: CreatorDealMeta;
};

export type CreatorOpportunity = {
  id: string;
  status: CollaborationStatus;
  agreedRateCents: number;
  createdAt?: string;
  updatedAt?: string;
  campaign: {
    title: string;
    brief: string;
  };
  brand: {
    company: string;
  };
};

export type DeliverableSummary = {
  draftUrl?: string | null;
  status?: string;
};

export type CreatorCollaboration = CreatorOpportunity & {
  deliverable?: DeliverableSummary | null;
};

export type CreatorProfileResponse = {
  profile: CreatorProfile;
};

export type LinkedInImportResponse = {
  profile: CreatorProfile;
  partial: boolean;
  notice: string | null;
};

export type CreatorOpportunitiesResponse = {
  opportunities: CreatorOpportunity[];
  followersGate?: number;
  followers?: number;
  gated?: boolean;
};

export type CreatorCollaborationsResponse = {
  collaborations: CreatorCollaboration[];
};

export type CollaborationMutationResponse = {
  collaboration: CreatorCollaboration;
};

export type DeliverableMutationResponse = {
  collaboration: CreatorCollaboration;
  deliverable: DeliverableSummary;
};

export type CreatorEarnings = {
  totalEarnedCents: number;
  inTransitCents: number;
  availableNowCents: number;
  overTime: { month: string; label: string; cents: number }[];
  stripeConnected: boolean;
  recent: {
    id: string;
    status: string;
    amountCents: number;
    brand: string;
    campaign: string;
    at: string;
  }[];
};

export type CreatorEarningsResponse = {
  earnings: CreatorEarnings;
};

export type PatchCreatorProfileBody = {
  name?: string;
  headline?: string;
  niche?: string;
  country?: string;
  bio?: string | null;
  ratePerPostCents?: number;
  cardPublished?: boolean;
  industries?: string[];
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  xUrl?: string | null;
  registrationCountry?: string | null;
  isRegisteredBusiness?: boolean | null;
  legalName?: string | null;
  legalAddress?: string | null;
  taxSelfDeclared?: boolean;
  invoiceAuthorized?: boolean;
  bankDetails?: {
    accountHolder?: string;
    iban?: string;
    bankName?: string;
  } | null;
  onboardingComplete?: boolean;
  followers?: number;
};

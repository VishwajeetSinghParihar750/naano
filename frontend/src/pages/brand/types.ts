export type CollaborationStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "draft_submitted"
  | "live"
  | "paid";

export type IcpItem = {
  title: string;
  description: string;
};

export type BrandProfile = {
  id: string;
  company: string;
  website?: string | null;
  walletBalanceCents: number;
  valueProp?: string | null;
  icp?: IcpItem[] | null;
  onboardingComplete: boolean;
};

export type BrandCampaign = {
  id: string;
  title: string;
  brief: string;
  budgetCents: number;
  status: string;
  createdAt?: string;
};

export type MarketplaceCreator = {
  id: string;
  name: string;
  headline: string;
  niche: string;
  country: string;
  followers: number;
  ratePerPostCents: number;
  industries?: string[];
  matchScore: number;
  estCpmCents: number | null;
  typicalReach: number | null;
  bundlePriceCents: number;
};

export type DeliverableSummary = {
  draftUrl?: string | null;
  status?: string;
};

export type BrandCollaboration = {
  id: string;
  status: CollaborationStatus;
  agreedRateCents: number;
  createdAt?: string;
  updatedAt?: string;
  creator: {
    id?: string;
    name: string;
    niche: string;
    ratePerPostCents?: number;
  };
  campaign: {
    title: string;
  };
  deliverable?: DeliverableSummary | null;
};

export type WalletTransaction = {
  id: string;
  type: "topup" | "booking_escrow" | "refund";
  amountCents: number;
  label: string;
  collaborationId?: string | null;
  createdAt: string;
};

export type BrandProfileResponse = {
  profile: BrandProfile;
};

export type BrandCampaignsResponse = {
  campaigns: BrandCampaign[];
};

export type BrandCampaignResponse = {
  campaign: BrandCampaign;
};

export type CampaignAiDraft = {
  title: string;
  destinationUrl: string;
  icp: string;
  oneClaim: string;
  mustNots: string;
};

export type CampaignAiDraftResponse = {
  draft: CampaignAiDraft;
};

export type CampaignFromLinkResponse = {
  draft: CampaignAiDraft;
  partial: boolean;
  notice: string | null;
};

export type CreateCampaignBody = {
  title: string;
  brief: string;
  budgetCents: number;
  status?: "draft" | "active";
};

export type CreateCampaignFromDraftBody = CampaignAiDraft & {
  budgetCents?: number;
  status?: "draft" | "active";
};

export type BrandCreatorsResponse = {
  creators: MarketplaceCreator[];
};

export type InviteCreatorBody = {
  creatorProfileId: string;
  postCount?: 1 | 3;
};

export type BrandCollaborationsResponse = {
  collaborations: BrandCollaboration[];
};

export type CollaborationMutationResponse = {
  collaboration: BrandCollaboration;
};

export type BrandWalletResponse = {
  wallet: {
    balanceCents: number;
    transactions: WalletTransaction[];
  };
};

export type BrandOverviewResponse = {
  overview: {
    company: string;
    website: string | null;
    valueProp: string | null;
    metrics: {
      creatorsActivated: number;
      postsPublished: number;
      openBookings: number;
      impressions: number;
    };
    bookings: BrandCollaboration[];
    newCreators: MarketplaceCreator[];
    todos: { id: string; label: string; suggested: boolean }[];
  };
};

export type AnalyzeWebsiteBody = {
  websiteUrl: string;
};

export type CompleteOnboardingBody = {
  valueProp?: string;
  icp?: IcpItem[];
  company?: string;
};

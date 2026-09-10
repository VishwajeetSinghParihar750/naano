export type CollaborationStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "draft_submitted"
  | "live"
  | "paid";

export type BrandProfile = {
  id: string;
  company: string;
  website?: string | null;
  walletBalanceCents: number;
};

export type BrandCampaign = {
  id: string;
  title: string;
  brief: string;
  budgetCents: number;
  status: string;
};

export type MarketplaceCreator = {
  id: string;
  name: string;
  headline: string;
  niche: string;
  country: string;
  followers: number;
  ratePerPostCents: number;
};

export type DeliverableSummary = {
  draftUrl?: string | null;
  status?: string;
};

export type BrandCollaboration = {
  id: string;
  status: CollaborationStatus;
  agreedRateCents: number;
  creator: {
    name: string;
    niche: string;
  };
  campaign: {
    title: string;
  };
  deliverable?: DeliverableSummary | null;
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

export type CreateCampaignBody = {
  title: string;
  brief: string;
  budgetCents: number;
};

export type BrandCreatorsResponse = {
  creators: MarketplaceCreator[];
};

export type InviteCreatorBody = {
  creatorProfileId: string;
};

export type BrandCollaborationsResponse = {
  collaborations: BrandCollaboration[];
};

export type CollaborationMutationResponse = {
  collaboration: BrandCollaboration;
};

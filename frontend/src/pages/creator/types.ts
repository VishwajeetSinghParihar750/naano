export type CollaborationStatus =
  | "invited"
  | "accepted"
  | "declined"
  | "draft_submitted"
  | "live"
  | "paid";

export type CreatorProfile = {
  id: string;
  name: string;
  headline: string;
  niche: string;
  country: string;
  followers: number;
  ratePerPostCents: number;
  cardPublished: boolean;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type CreatorOpportunity = {
  id: string;
  status: CollaborationStatus;
  agreedRateCents: number;
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

export type CreatorOpportunitiesResponse = {
  opportunities: CreatorOpportunity[];
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

export type PatchCreatorProfileBody = {
  name?: string;
  headline?: string;
  niche?: string;
  country?: string;
  bio?: string;
  ratePerPostCents?: number;
  cardPublished?: boolean;
};

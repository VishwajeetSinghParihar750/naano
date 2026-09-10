import { prisma } from "../lib/prisma.js";
import type { CollaborationStatus } from "@prisma/client";

const collaborationInclude = {
  creator: true,
  campaign: true,
  deliverable: true,
} as const;

const marketplaceCreatorSelect = {
  id: true,
  name: true,
  headline: true,
  niche: true,
  country: true,
  followers: true,
  ratePerPostCents: true,
} as const;

export const brandRepo = {
  findProfileByUserId(userId: string) {
    return prisma.brandProfile.findUnique({ where: { userId } });
  },

  listCampaigns(brandProfileId: string) {
    return prisma.campaign.findMany({
      where: { brandProfileId },
      orderBy: { createdAt: "desc" },
    });
  },

  createCampaign(
    brandProfileId: string,
    data: { title: string; brief: string; budgetCents: number },
  ) {
    return prisma.campaign.create({
      data: {
        brandProfileId,
        title: data.title,
        brief: data.brief,
        budgetCents: data.budgetCents,
        status: "active",
      },
    });
  },

  findCampaign(id: string) {
    return prisma.campaign.findUnique({ where: { id } });
  },

  listPublishedCreators() {
    return prisma.creatorProfile.findMany({
      where: { cardPublished: true },
      select: marketplaceCreatorSelect,
      orderBy: { name: "asc" },
    });
  },

  findCreatorProfile(id: string) {
    return prisma.creatorProfile.findUnique({ where: { id } });
  },

  createCollaboration(data: {
    campaignId: string;
    creatorProfileId: string;
    agreedRateCents: number;
  }) {
    return prisma.collaboration.create({
      data: {
        campaignId: data.campaignId,
        creatorProfileId: data.creatorProfileId,
        agreedRateCents: data.agreedRateCents,
        status: "invited",
      },
      include: collaborationInclude,
    });
  },

  listCollaborations(brandProfileId: string) {
    return prisma.collaboration.findMany({
      where: { campaign: { brandProfileId } },
      include: collaborationInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findCollaboration(id: string) {
    return prisma.collaboration.findUnique({
      where: { id },
      include: collaborationInclude,
    });
  },

  updateCollaborationStatus(id: string, status: CollaborationStatus) {
    return prisma.collaboration.update({
      where: { id },
      data: { status },
      include: collaborationInclude,
    });
  },

  approveDeliverable(collaborationId: string) {
    return prisma.deliverable.update({
      where: { collaborationId },
      data: { status: "approved" },
    });
  },
};

import { prisma } from "../lib/prisma.js";
import type {
  CollaborationStatus,
  Prisma,
} from "@prisma/client";

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
  industries: true,
  cardPublished: true,
  createdAt: true,
} as const;

export const brandRepo = {
  findProfileByUserId(userId: string) {
    return prisma.brandProfile.findUnique({ where: { userId } });
  },

  updateProfile(userId: string, data: Prisma.BrandProfileUpdateInput) {
    return prisma.brandProfile.update({ where: { userId }, data });
  },

  deleteUser(userId: string) {
    return prisma.user.delete({ where: { id: userId } });
  },

  listCampaigns(brandProfileId: string) {
    return prisma.campaign.findMany({
      where: { brandProfileId },
      orderBy: { createdAt: "desc" },
    });
  },

    createCampaign(
    brandProfileId: string,
    data: { title: string; brief: string; budgetCents: number; status?: "draft" | "active" },
  ) {
    return prisma.campaign.create({
      data: {
        brandProfileId,
        title: data.title,
        brief: data.brief,
        budgetCents: data.budgetCents,
        status: data.status ?? "draft",
      },
    });
  },

  findCampaign(id: string) {
    return prisma.campaign.findUnique({ where: { id } });
  },

  updateCampaignStatus(id: string, status: "draft" | "active") {
    return prisma.campaign.update({
      where: { id },
      data: { status },
    });
  },

  listPublishedCreators() {
    return prisma.creatorProfile.findMany({
      where: { cardPublished: true },
      select: marketplaceCreatorSelect,
      orderBy: { name: "asc" },
    });
  },

  listRecentCreators(limit = 4) {
    return prisma.creatorProfile.findMany({
      where: { cardPublished: true },
      select: marketplaceCreatorSelect,
      orderBy: { createdAt: "desc" },
      take: limit,
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

  listWalletTransactions(brandProfileId: string) {
    return prisma.walletTransaction.findMany({
      where: { brandProfileId },
      orderBy: { createdAt: "desc" },
    });
  },

  async topupWallet(
    brandProfileId: string,
    amountCents: number,
    label: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.brandProfile.update({
        where: { id: brandProfileId },
        data: { walletBalanceCents: { increment: amountCents } },
      });
      const txn = await tx.walletTransaction.create({
        data: {
          brandProfileId,
          type: "topup",
          amountCents,
          label,
        },
      });
      return { profile, txn };
    });
  },

  async bookWithEscrow(input: {
    brandProfileId: string;
    campaignId: string;
    creatorProfileId: string;
    agreedRateCents: number;
    label: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.brandProfile.updateMany({
        where: {
          id: input.brandProfileId,
          walletBalanceCents: { gte: input.agreedRateCents },
        },
        data: { walletBalanceCents: { decrement: input.agreedRateCents } },
      });
      if (updated.count === 0) {
        throw new Error("insufficient_funds");
      }
      const collab = await tx.collaboration.create({
        data: {
          campaignId: input.campaignId,
          creatorProfileId: input.creatorProfileId,
          agreedRateCents: input.agreedRateCents,
          status: "invited",
        },
        include: collaborationInclude,
      });
      await tx.walletTransaction.create({
        data: {
          brandProfileId: input.brandProfileId,
          type: "booking_escrow",
          amountCents: -input.agreedRateCents,
          label: input.label,
          collaborationId: collab.id,
        },
      });
      return collab;
    });
  },

  async refundEscrow(input: {
    brandProfileId: string;
    collaborationId: string;
    amountCents: number;
    label: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const escrow = await tx.walletTransaction.findFirst({
        where: {
          collaborationId: input.collaborationId,
          type: "booking_escrow",
        },
      });
      if (!escrow) {
        return null;
      }
      const already = await tx.walletTransaction.findFirst({
        where: {
          collaborationId: input.collaborationId,
          type: "refund",
        },
      });
      if (already) {
        return already;
      }
      await tx.brandProfile.update({
        where: { id: input.brandProfileId },
        data: { walletBalanceCents: { increment: input.amountCents } },
      });
      return tx.walletTransaction.create({
        data: {
          brandProfileId: input.brandProfileId,
          type: "refund",
          amountCents: input.amountCents,
          label: input.label,
          collaborationId: input.collaborationId,
        },
      });
    });
  },
};

import { Prisma } from "@prisma/client";
import { brandRepo } from "../repositories/brand.repo.js";

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function requireBrandProfile(userId: string) {
  const profile = await brandRepo.findProfileByUserId(userId);
  if (!profile) {
    throw new DomainError("not_found", "Brand profile not found", 404);
  }
  return profile;
}

async function requireOwnCollaboration(
  userId: string,
  collaborationId: string,
) {
  const profile = await requireBrandProfile(userId);
  const collab = await brandRepo.findCollaboration(collaborationId);
  if (!collab || collab.campaign.brandProfileId !== profile.id) {
    throw new DomainError("not_found", "Collaboration not found", 404);
  }
  return { profile, collab };
}

/** Flatten nested relations for the S07 brand API contract. */
function presentCollaboration(
  collab: NonNullable<Awaited<ReturnType<typeof brandRepo.findCollaboration>>>,
) {
  return {
    id: collab.id,
    status: collab.status,
    agreedRateCents: collab.agreedRateCents,
    creator: {
      name: collab.creator.name,
      niche: collab.creator.niche,
      ratePerPostCents: collab.creator.ratePerPostCents,
    },
    campaign: {
      title: collab.campaign.title,
    },
    deliverable: collab.deliverable
      ? {
          draftUrl: collab.deliverable.draftUrl,
          status: collab.deliverable.status,
        }
      : null,
  };
}

export const brandService = {
  async getMe(userId: string) {
    return requireBrandProfile(userId);
  },

  async listCampaigns(userId: string) {
    const profile = await requireBrandProfile(userId);
    return brandRepo.listCampaigns(profile.id);
  },

  async createCampaign(
    userId: string,
    input: { title: string; brief: string; budgetCents: number },
  ) {
    const profile = await requireBrandProfile(userId);
    return brandRepo.createCampaign(profile.id, input);
  },

  async listCreators(_userId: string) {
    await requireBrandProfile(_userId);
    return brandRepo.listPublishedCreators();
  },

  async invite(
    userId: string,
    campaignId: string,
    creatorProfileId: string,
  ) {
    const profile = await requireBrandProfile(userId);
    const campaign = await brandRepo.findCampaign(campaignId);
    if (!campaign || campaign.brandProfileId !== profile.id) {
      throw new DomainError(
        "conflict",
        "Campaign not found or not owned",
        409,
      );
    }

    const creator = await brandRepo.findCreatorProfile(creatorProfileId);
    if (!creator) {
      throw new DomainError("not_found", "Creator profile not found", 404);
    }

    try {
      const collab = await brandRepo.createCollaboration({
        campaignId: campaign.id,
        creatorProfileId: creator.id,
        agreedRateCents: creator.ratePerPostCents,
      });
      return presentCollaboration(collab);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new DomainError(
          "conflict",
          "Creator already invited to this campaign",
          409,
        );
      }
      throw err;
    }
  },

  async listCollaborations(userId: string) {
    const profile = await requireBrandProfile(userId);
    const rows = await brandRepo.listCollaborations(profile.id);
    return rows.map(presentCollaboration);
  },

  async approve(userId: string, collaborationId: string) {
    const { collab } = await requireOwnCollaboration(userId, collaborationId);
    if (collab.status !== "draft_submitted") {
      throw new DomainError(
        "invalid_status",
        "Collaboration must be draft_submitted to approve",
        409,
      );
    }

    if (collab.deliverable) {
      await brandRepo.approveDeliverable(collab.id);
    }

    const updated = await brandRepo.updateCollaborationStatus(collab.id, "live");
    return presentCollaboration(updated);
  },

  async markPaid(userId: string, collaborationId: string) {
    const { collab } = await requireOwnCollaboration(userId, collaborationId);
    if (collab.status !== "live") {
      throw new DomainError(
        "invalid_status",
        "Collaboration must be live to mark paid",
        409,
      );
    }
    const updated = await brandRepo.updateCollaborationStatus(collab.id, "paid");
    return presentCollaboration(updated);
  },
};

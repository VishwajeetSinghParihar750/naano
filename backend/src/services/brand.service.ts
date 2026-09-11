import { Prisma } from "@prisma/client";
import { brandRepo } from "../repositories/brand.repo.js";
import { analyzeCompanyWebsite } from "./website-analyze.service.js";
import {
  composeBriefFromDraft,
  draftCampaignBrief,
  recoverCampaignFromLink as recoverCampaignBriefFromUrl,
  type CampaignAiDraft,
  type CampaignLinkRecoverResult,
} from "./campaign-ai.service.js";

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type IcpItem = { title: string; description: string };

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

function presentCollaboration(
  collab: NonNullable<Awaited<ReturnType<typeof brandRepo.findCollaboration>>>,
) {
  return {
    id: collab.id,
    status: collab.status,
    agreedRateCents: collab.agreedRateCents,
    createdAt: collab.createdAt,
    updatedAt: collab.updatedAt,
    creator: {
      id: collab.creator.id,
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

function presentCreator(
  c: Awaited<ReturnType<typeof brandRepo.listPublishedCreators>>[number],
) {
  const rate = c.ratePerPostCents;
  const followers = c.followers;
  const typicalReach =
    followers > 0 ? Math.max(40, Math.round(followers * 0.18)) : null;
  const estCpmCents =
    typicalReach && typicalReach > 0
      ? Math.round((rate / typicalReach) * 1000)
      : null;
  // Heuristic match score from followers + rate band.
  const matchScore = Math.min(
    98,
    Math.max(
      32,
      Math.round(40 + Math.log10(Math.max(followers, 10)) * 18 + (rate > 0 ? 8 : 0)),
    ),
  );
  const bundlePriceCents = Math.round(rate * 3 * 0.95);

  return {
    id: c.id,
    name: c.name,
    headline: c.headline,
    niche: c.niche,
    country: c.country,
    followers: c.followers,
    ratePerPostCents: c.ratePerPostCents,
    industries: c.industries ?? [],
    matchScore,
    estCpmCents,
    typicalReach,
    bundlePriceCents,
  };
}

export const brandService = {
  async getMe(userId: string) {
    return requireBrandProfile(userId);
  },

  async updateMe(
    userId: string,
    input: {
      company?: string;
      website?: string | null;
      valueProp?: string | null;
    },
  ) {
    await requireBrandProfile(userId);
    return brandRepo.updateProfile(userId, {
      ...(input.company !== undefined && { company: input.company }),
      ...(input.website !== undefined && { website: input.website }),
      ...(input.valueProp !== undefined && { valueProp: input.valueProp }),
    });
  },

  async deleteAccount(userId: string) {
    await requireBrandProfile(userId);
    await brandRepo.deleteUser(userId);
  },

  async analyzeWebsite(userId: string, websiteUrl: string) {
    const profile = await requireBrandProfile(userId);
    let analysis;
    try {
      analysis = await analyzeCompanyWebsite(websiteUrl, profile.company);
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "Timed out fetching that website. Check the URL and try again."
          : err instanceof Error
            ? err.message
            : "Could not fetch that website.";
      throw new DomainError("analyze_failed", msg, 422);
    }

    return brandRepo.updateProfile(userId, {
      website: analysis.scrape.url || websiteUrl,
      company: analysis.company,
      valueProp: analysis.valueProp,
      icp: analysis.icp as unknown as Prisma.InputJsonValue,
    });
  },

  async completeOnboarding(
    userId: string,
    input?: { valueProp?: string; icp?: IcpItem[]; company?: string },
  ) {
    await requireBrandProfile(userId);
    return brandRepo.updateProfile(userId, {
      ...(input?.valueProp !== undefined && { valueProp: input.valueProp }),
      ...(input?.icp !== undefined && {
        icp: input.icp as unknown as Prisma.InputJsonValue,
      }),
      ...(input?.company !== undefined && { company: input.company }),
      onboardingComplete: true,
    });
  },

  async getOverview(userId: string) {
    const profile = await requireBrandProfile(userId);
    const [collabs, newCreators] = await Promise.all([
      brandRepo.listCollaborations(profile.id),
      brandRepo.listRecentCreators(4),
    ]);

    const creatorsActivated = new Set(
      collabs
        .filter((c) =>
          ["accepted", "draft_submitted", "live", "paid"].includes(c.status),
        )
        .map((c) => c.creatorProfileId),
    ).size;
    const postsPublished = collabs.filter((c) =>
      ["live", "paid"].includes(c.status),
    ).length;
    const openBookings = collabs.filter((c) =>
      ["invited", "accepted", "draft_submitted", "live"].includes(c.status),
    ).length;
    const impressions = postsPublished * 2400;

    return {
      company: profile.company,
      website: profile.website,
      valueProp: profile.valueProp,
      metrics: {
        creatorsActivated,
        postsPublished,
        openBookings,
        impressions,
      },
      bookings: collabs.slice(0, 5).map(presentCollaboration),
      newCreators: newCreators.map(presentCreator),
      todos: [
        { id: "launch", label: "Launch a campaign", suggested: true },
        { id: "book", label: "Book a creator", suggested: true },
      ],
    };
  },

  async listCampaigns(userId: string) {
    const profile = await requireBrandProfile(userId);
    return brandRepo.listCampaigns(profile.id);
  },

  async draftCampaignAi(userId: string, prompt: string): Promise<CampaignAiDraft> {
    const profile = await requireBrandProfile(userId);
    return draftCampaignBrief({
      prompt,
      company: profile.company,
      website: profile.website,
      valueProp: profile.valueProp,
    });
  },

  async recoverCampaignFromLink(
    userId: string,
    sourceUrl: string,
  ): Promise<CampaignLinkRecoverResult> {
    const profile = await requireBrandProfile(userId);
    return recoverCampaignBriefFromUrl({
      sourceUrl,
      company: profile.company,
      website: profile.website,
      valueProp: profile.valueProp,
    });
  },

  composeCampaignBrief(draft: CampaignAiDraft): string {
    return composeBriefFromDraft(draft);
  },

  async createCampaign(
    userId: string,
    input: {
      title: string;
      brief: string;
      budgetCents: number;
      status?: "draft" | "active";
    },
  ) {
    const profile = await requireBrandProfile(userId);
    return brandRepo.createCampaign(profile.id, input);
  },

  async activateCampaign(userId: string, campaignId: string) {
    const profile = await requireBrandProfile(userId);
    const campaign = await brandRepo.findCampaign(campaignId);
    if (!campaign || campaign.brandProfileId !== profile.id) {
      throw new DomainError(
        "not_found",
        "Campaign not found or not owned",
        404,
      );
    }
    if (campaign.status === "active") return campaign;
    return brandRepo.updateCampaignStatus(campaign.id, "active");
  },

  async listCreators(_userId: string) {
    await requireBrandProfile(_userId);
    const rows = await brandRepo.listPublishedCreators();
    return rows.map(presentCreator);
  },

  async getWallet(userId: string) {
    const profile = await requireBrandProfile(userId);
    const transactions = await brandRepo.listWalletTransactions(profile.id);
    return {
      balanceCents: profile.walletBalanceCents,
      transactions,
    };
  },

  async topup(userId: string, amountCents: number) {
    const profile = await requireBrandProfile(userId);
    if (amountCents <= 0) {
      throw new DomainError("invalid_input", "Amount must be positive", 400);
    }
    const INT32_MAX = 2_147_483_647;
    if (
      amountCents > INT32_MAX ||
      profile.walletBalanceCents + amountCents > INT32_MAX
    ) {
      throw new DomainError(
        "invalid_input",
        "Amount is too large for wallet balance",
        400,
      );
    }
    const { profile: updated, txn } = await brandRepo.topupWallet(
      profile.id,
      amountCents,
      `Wallet top-up`,
    );
    return {
      balanceCents: updated.walletBalanceCents,
      transaction: txn,
    };
  },

  async invite(
    userId: string,
    campaignId: string,
    creatorProfileId: string,
    postCount: 1 | 3 = 1,
  ) {
    const profile = await requireBrandProfile(userId);
    const campaign = await brandRepo.findCampaign(campaignId);
    if (!campaign || campaign.brandProfileId !== profile.id) {
      throw new DomainError(
        "not_found",
        "Campaign not found or not owned",
        404,
      );
    }
    if (campaign.status !== "active") {
      throw new DomainError(
        "invalid_status",
        "Only active campaigns can invite creators",
        409,
      );
    }

    const creator = await brandRepo.findCreatorProfile(creatorProfileId);
    if (!creator) {
      throw new DomainError("not_found", "Creator profile not found", 404);
    }

    const unit = creator.ratePerPostCents;
    const agreedRateCents =
      postCount === 3 ? Math.round(unit * 3 * 0.95) : unit;

    try {
      const collab = await brandRepo.bookWithEscrow({
        brandProfileId: profile.id,
        campaignId: campaign.id,
        creatorProfileId: creator.id,
        agreedRateCents,
        label: `Escrow · ${creator.name} · ${campaign.title}`,
      });
      return presentCollaboration(collab);
    } catch (err) {
      if (err instanceof Error && err.message === "insufficient_funds") {
        throw new DomainError(
          "insufficient_funds",
          "Not enough wallet balance. Top up billing first.",
          402,
        );
      }
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

  /** Called from creator decline path via brandRepo (or exported helper). */
  async refundOnDecline(collaborationId: string) {
    const collab = await brandRepo.findCollaboration(collaborationId);
    if (!collab) return;
    const brandProfileId = collab.campaign.brandProfileId;
    await brandRepo.refundEscrow({
      brandProfileId,
      collaborationId: collab.id,
      amountCents: collab.agreedRateCents,
      label: `Refund · ${collab.creator.name}`,
    });
  },
};

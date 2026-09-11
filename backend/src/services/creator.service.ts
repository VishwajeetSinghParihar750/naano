import type { Prisma } from "@prisma/client";
import { Prisma as PrismaValue } from "@prisma/client";
import { creatorRepo } from "../repositories/creator.repo.js";
import {
  CREATOR_SHARE,
  FOLLOWERS_GATE,
  REWARD_MONTHS,
} from "../lib/creator-constants.js";
import { analyzeYouTubeChannel } from "./youtube-analyze.service.js";
import { analyzeLinkedInProfile } from "./linkedin-analyze.service.js";

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export type CreatorProfileUpdate = {
  ratePerPostCents?: number;
  headline?: string;
  niche?: string;
  country?: string;
  bio?: string | null;
  cardPublished?: boolean;
  name?: string;
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
  bankDetails?: Prisma.InputJsonValue | null;
  onboardingComplete?: boolean;
  followers?: number;
};

async function requireCreatorProfile(userId: string) {
  const profile = await creatorRepo.findProfileByUserId(userId);
  if (!profile) {
    throw new DomainError("not_found", "Creator profile not found", 404);
  }
  return profile;
}

async function requireOwnCollaboration(
  userId: string,
  collaborationId: string,
) {
  const profile = await requireCreatorProfile(userId);
  const collab = await creatorRepo.findCollaboration(collaborationId);
  if (!collab || collab.creatorProfileId !== profile.id) {
    throw new DomainError("not_found", "Collaboration not found", 404);
  }
  return { profile, collab };
}

/** Flatten campaign.brand → top-level brand for the S06 API contract. */
function presentCollaboration(
  collab: NonNullable<Awaited<ReturnType<typeof creatorRepo.findCollaboration>>>,
) {
  return {
    id: collab.id,
    status: collab.status,
    agreedRateCents: collab.agreedRateCents,
    createdAt: collab.createdAt,
    updatedAt: collab.updatedAt,
    campaign: {
      title: collab.campaign.title,
      brief: collab.campaign.brief,
    },
    brand: {
      company: collab.campaign.brand.company,
    },
    deliverable: collab.deliverable
      ? {
          draftUrl: collab.deliverable.draftUrl,
          status: collab.deliverable.status,
        }
      : null,
  };
}

function presentProfile(
  profile: Awaited<ReturnType<typeof creatorRepo.findProfileByUserId>>,
) {
  if (!profile) return null;
  const videoCount = profile.videoCount ?? 0;
  const viewCount = profile.viewCount ?? 0;
  const stored = profile.estImpressions ?? 0;
  const estImpressions =
    stored > 0
      ? stored
      : videoCount > 0
        ? Math.round(viewCount / videoCount)
        : 0;
  return {
    ...profile,
    estImpressions,
    deal: {
      creatorShare: CREATOR_SHARE,
      rewardMonths: REWARD_MONTHS,
      followersGate: FOLLOWERS_GATE,
    },
  };
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const creatorService = {
  async getMe(userId: string) {
    const profile = await requireCreatorProfile(userId);
    return presentProfile(profile);
  },

  async updateMe(userId: string, input: CreatorProfileUpdate) {
    await requireCreatorProfile(userId);
    const data: Prisma.CreatorProfileUpdateInput = {};
    if (input.ratePerPostCents !== undefined)
      data.ratePerPostCents = input.ratePerPostCents;
    if (input.headline !== undefined) data.headline = input.headline;
    if (input.niche !== undefined) data.niche = input.niche;
    if (input.country !== undefined) data.country = input.country;
    if (input.bio !== undefined) data.bio = input.bio;
    if (input.cardPublished !== undefined)
      data.cardPublished = input.cardPublished;
    if (input.name !== undefined) data.name = input.name;
    if (input.industries !== undefined) data.industries = input.industries;
    if (input.linkedinUrl !== undefined) data.linkedinUrl = input.linkedinUrl;
    if (input.youtubeUrl !== undefined) data.youtubeUrl = input.youtubeUrl;
    if (input.xUrl !== undefined) data.xUrl = input.xUrl;
    if (input.registrationCountry !== undefined)
      data.registrationCountry = input.registrationCountry;
    if (input.isRegisteredBusiness !== undefined)
      data.isRegisteredBusiness = input.isRegisteredBusiness;
    if (input.legalName !== undefined) data.legalName = input.legalName;
    if (input.legalAddress !== undefined) data.legalAddress = input.legalAddress;
    if (input.taxSelfDeclared !== undefined)
      data.taxSelfDeclared = input.taxSelfDeclared;
    if (input.invoiceAuthorized !== undefined)
      data.invoiceAuthorized = input.invoiceAuthorized;
    if (input.bankDetails !== undefined) {
      data.bankDetails =
        input.bankDetails === null ? PrismaValue.DbNull : input.bankDetails;
    }
    if (input.onboardingComplete !== undefined)
      data.onboardingComplete = input.onboardingComplete;
    if (input.followers !== undefined) data.followers = input.followers;

    const updated = await creatorRepo.updateProfile(userId, data);
    return presentProfile(updated);
  },

  async analyzeYouTube(userId: string, youtubeUrl: string) {
    const existing = await requireCreatorProfile(userId);

    let result;
    try {
      result = await analyzeYouTubeChannel(youtubeUrl);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Enter a valid YouTube channel URL.";
      throw new DomainError("invalid_input", msg, 400);
    }

    const { analysis, partial, notice } = result;
    const data: Prisma.CreatorProfileUpdateInput = {
      youtubeUrl: analysis.channelUrl,
    };

    const applyStats = () => {
      if (analysis.followers > 0) data.followers = analysis.followers;
      if (analysis.videoCount > 0) data.videoCount = analysis.videoCount;
      if (analysis.viewCount > 0) data.viewCount = analysis.viewCount;
      if (analysis.estImpressions > 0) {
        data.estImpressions = analysis.estImpressions;
      }
      // Always write recent post windows when we resolved a channel (0 is valid).
      if (analysis.channelId || analysis.posts7d > 0 || analysis.posts90d > 0) {
        data.posts7d = analysis.posts7d;
        data.posts90d = analysis.posts90d;
      }
    };

    if (!partial) {
      if (analysis.name) data.name = analysis.name;
      if (analysis.headline) data.headline = analysis.headline;
      if (analysis.niche || analysis.headline) {
        data.niche = analysis.niche || analysis.headline;
      }
      if (analysis.bio) data.bio = analysis.bio;
      applyStats();
      // Successful import with 0 subscribers (hidden) still clears stale zeros on first run.
      if (!existing.onboardingComplete && analysis.followers <= 0) {
        data.followers = 0;
      }
    } else if (!existing.onboardingComplete) {
      // First-time soft-fail: keep URL; apply any stats we did recover.
      if (analysis.name && !existing.name?.trim()) data.name = analysis.name;
      if (!existing.headline?.trim() && analysis.headline) {
        data.headline = analysis.headline;
      }
      if (!existing.niche?.trim() && (analysis.niche || analysis.headline)) {
        data.niche = analysis.niche || analysis.headline;
      }
      applyStats();
      if (analysis.followers <= 0) data.followers = 0;
    } else {
      // Settings refresh + soft-fail: never wipe name/followers; still upgrade stats if present.
      applyStats();
    }

    const updated = await creatorRepo.updateProfile(userId, data);
    return {
      profile: presentProfile(updated),
      partial: partial || analysis.followers <= 0,
      notice,
    };
  },

  async analyzeLinkedIn(userId: string, linkedinUrl: string) {
    const existing = await requireCreatorProfile(userId);

    let result;
    try {
      result = await analyzeLinkedInProfile(linkedinUrl);
    } catch (err) {
      // Invalid URL format only
      const msg =
        err instanceof Error ? err.message : "Enter a valid LinkedIn profile URL.";
      throw new DomainError("invalid_input", msg, 400);
    }

    const { analysis, partial, notice } = result;
    const data: Prisma.CreatorProfileUpdateInput = {
      linkedinUrl: analysis.scrape.url,
    };

    if (!partial) {
      data.name = analysis.name;
      data.headline = analysis.headline;
      data.niche = analysis.niche || analysis.headline;
      data.followers = analysis.followers;
      if (analysis.country) data.country = analysis.country;
      if (analysis.bio) data.bio = analysis.bio;
    } else if (!existing.onboardingComplete) {
      // First-time signup: save URL + slug name, zero stats — do not block.
      if (analysis.name) data.name = analysis.name;
      data.followers = 0;
      if (!existing.headline?.trim()) data.headline = analysis.headline || "";
      if (!existing.niche?.trim()) data.niche = analysis.niche || "";
    }
    // Settings refresh + partial: keep existing headline/followers; only URL updated.

    const updated = await creatorRepo.updateProfile(userId, data);
    return {
      profile: presentProfile(updated),
      partial,
      notice,
    };
  },

  async completeOnboarding(userId: string) {
    await requireCreatorProfile(userId);
    const updated = await creatorRepo.updateProfile(userId, {
      onboardingComplete: true,
      cardPublished: true,
    });
    return presentProfile(updated);
  },

  async getEarnings(userId: string) {
    const profile = await requireCreatorProfile(userId);
    const rows = await creatorRepo.listCollaborations(profile.id);

    let totalEarnedCents = 0;
    let inTransitCents = 0;
    const paid: { cents: number; at: Date }[] = [];

    for (const row of rows) {
      if (row.status === "paid") {
        totalEarnedCents += row.agreedRateCents;
        paid.push({ cents: row.agreedRateCents, at: row.updatedAt });
      } else if (row.status === "live") {
        inTransitCents += row.agreedRateCents;
      }
    }

    const now = new Date();
    const buckets: { month: string; label: string; cents: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = monthKey(d);
      buckets.push({
        month: key,
        label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        cents: 0,
      });
    }
    const byMonth = new Map(buckets.map((b) => [b.month, b]));
    for (const p of paid) {
      const key = monthKey(p.at);
      const bucket = byMonth.get(key);
      if (bucket) bucket.cents += p.cents;
    }

    return {
      totalEarnedCents,
      inTransitCents,
      availableNowCents: totalEarnedCents,
      overTime: buckets,
      stripeConnected: false,
      recent: rows
        .filter((r) => r.status === "paid" || r.status === "live")
        .slice(0, 10)
        .map((r) => ({
          id: r.id,
          status: r.status,
          amountCents: r.agreedRateCents,
          brand: r.campaign.brand.company,
          campaign: r.campaign.title,
          at: r.updatedAt,
        })),
    };
  },

  async listOpportunities(userId: string) {
    const profile = await requireCreatorProfile(userId);
    const rows = await creatorRepo.listCollaborations(profile.id, "invited");
    return {
      opportunities: rows.map(presentCollaboration),
      followersGate: FOLLOWERS_GATE,
      followers: profile.followers,
      gated: profile.followers < FOLLOWERS_GATE,
    };
  },

  async listCollaborations(userId: string) {
    const profile = await requireCreatorProfile(userId);
    const rows = await creatorRepo.listCollaborations(profile.id);
    return rows.map(presentCollaboration);
  },

  async accept(userId: string, collaborationId: string) {
    const { collab } = await requireOwnCollaboration(userId, collaborationId);
    if (collab.status !== "invited") {
      throw new DomainError(
        "invalid_status",
        "Collaboration must be invited to accept",
        409,
      );
    }
    const updated = await creatorRepo.updateCollaborationStatus(
      collab.id,
      "accepted",
    );
    return presentCollaboration(updated);
  },

  async decline(userId: string, collaborationId: string) {
    const { collab } = await requireOwnCollaboration(userId, collaborationId);
    if (collab.status !== "invited") {
      throw new DomainError(
        "invalid_status",
        "Collaboration must be invited to decline",
        409,
      );
    }
    const updated = await creatorRepo.updateCollaborationStatus(
      collab.id,
      "declined",
    );
    // Refund escrow held at booking time (best-effort; seed invites may predate wallet ledger).
    try {
      const { brandService } = await import("./brand.service.js");
      await brandService.refundOnDecline(collab.id);
    } catch {
      // ignore missing escrow / already-refunded
    }
    return presentCollaboration(updated);
  },

  async submitDeliverable(
    userId: string,
    collaborationId: string,
    draftUrl: string,
  ) {
    const { collab } = await requireOwnCollaboration(userId, collaborationId);

    if (collab.status !== "accepted" && collab.status !== "draft_submitted") {
      throw new DomainError(
        "invalid_status",
        "Collaboration must be accepted to submit a deliverable",
        409,
      );
    }

    const now = new Date();
    const deliverable = await creatorRepo.upsertDeliverable(collab.id, {
      draftUrl,
      status: "submitted",
      submittedAt: now,
    });

    const collaboration =
      collab.status === "accepted"
        ? await creatorRepo.updateCollaborationStatus(
            collab.id,
            "draft_submitted",
          )
        : await creatorRepo.findCollaboration(collab.id);

    if (!collaboration) {
      throw new DomainError("not_found", "Collaboration not found", 404);
    }

    return {
      collaboration: presentCollaboration(collaboration),
      deliverable: {
        draftUrl: deliverable.draftUrl,
        status: deliverable.status,
      },
    };
  },

  async deleteAccount(userId: string) {
    await requireCreatorProfile(userId);
    await creatorRepo.deleteUser(userId);
  },
};

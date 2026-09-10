import { creatorRepo } from "../repositories/creator.repo.js";

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

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

export const creatorService = {
  async getMe(userId: string) {
    return requireCreatorProfile(userId);
  },

  async updateMe(
    userId: string,
    input: {
      ratePerPostCents?: number;
      headline?: string;
      niche?: string;
      country?: string;
      bio?: string | null;
      cardPublished?: boolean;
      name?: string;
    },
  ) {
    await requireCreatorProfile(userId);
    return creatorRepo.updateProfile(userId, {
      ...(input.ratePerPostCents !== undefined && {
        ratePerPostCents: input.ratePerPostCents,
      }),
      ...(input.headline !== undefined && { headline: input.headline }),
      ...(input.niche !== undefined && { niche: input.niche }),
      ...(input.country !== undefined && { country: input.country }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.cardPublished !== undefined && {
        cardPublished: input.cardPublished,
      }),
      ...(input.name !== undefined && { name: input.name }),
    });
  },

  async listOpportunities(userId: string) {
    const profile = await requireCreatorProfile(userId);
    const rows = await creatorRepo.listCollaborations(profile.id, "invited");
    return rows.map(presentCollaboration);
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
};

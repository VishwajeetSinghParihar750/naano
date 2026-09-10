import { prisma } from "../lib/prisma.js";
import type { CollaborationStatus, Prisma } from "@prisma/client";

const collaborationInclude = {
  campaign: {
    include: {
      brand: true,
    },
  },
  deliverable: true,
} as const;

export const creatorRepo = {
  findProfileByUserId(userId: string) {
    return prisma.creatorProfile.findUnique({ where: { userId } });
  },

  updateProfile(
    userId: string,
    data: Prisma.CreatorProfileUpdateInput,
  ) {
    return prisma.creatorProfile.update({
      where: { userId },
      data,
    });
  },

  listCollaborations(
    creatorProfileId: string,
    status?: CollaborationStatus,
  ) {
    return prisma.collaboration.findMany({
      where: {
        creatorProfileId,
        ...(status ? { status } : {}),
      },
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

  upsertDeliverable(
    collaborationId: string,
    data: { draftUrl: string; status: "submitted"; submittedAt: Date },
  ) {
    return prisma.deliverable.upsert({
      where: { collaborationId },
      create: {
        collaborationId,
        draftUrl: data.draftUrl,
        status: data.status,
        submittedAt: data.submittedAt,
      },
      update: {
        draftUrl: data.draftUrl,
        status: data.status,
        submittedAt: data.submittedAt,
      },
    });
  },
};

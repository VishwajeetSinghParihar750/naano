import { prisma } from "../lib/prisma.js";
import type { Role } from "@prisma/client";

export const userRepo = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  /**
   * Creates a user plus the profile matching their role, in one transaction.
   */
  async createWithProfile(input: {
    email: string;
    passwordHash: string;
    role: Role;
    name?: string;
  }) {
    const displayName = input.name?.trim() || input.email.split("@")[0];
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
        },
      });
      if (input.role === "creator") {
        await tx.creatorProfile.create({
          data: {
            userId: user.id,
            name: displayName,
            headline: "",
            niche: "",
            country: "",
            followers: 0,
            ratePerPostCents: 0,
            cardPublished: false,
          },
        });
      } else {
        await tx.brandProfile.create({
          data: {
            userId: user.id,
            company: displayName,
          },
        });
      }
      return user;
    });
  },
};

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";

const publicRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { cardSlug: string } }>(
    "/public/creators/:cardSlug",
    async (req, reply) => {
      const cardSlug = req.params.cardSlug?.trim();
      if (!cardSlug) {
        return reply.code(400).send({
          error: { code: "invalid_input", message: "cardSlug is required" },
        });
      }

      const profile = await prisma.creatorProfile.findUnique({
        where: { cardSlug },
        select: {
          name: true,
          headline: true,
          niche: true,
          country: true,
          followers: true,
          videoCount: true,
          viewCount: true,
          posts7d: true,
          posts90d: true,
          estImpressions: true,
          ratePerPostCents: true,
          industries: true,
          cardSlug: true,
          cardPublished: true,
          bio: true,
        },
      });

      if (!profile || !profile.cardPublished) {
        return reply.code(404).send({
          error: { code: "not_found", message: "Creator card not found" },
        });
      }

      return {
        creator: {
          name: profile.name,
          headline: profile.headline,
          niche: profile.niche,
          country: profile.country,
          followers: profile.followers,
          videoCount: profile.videoCount,
          viewCount: profile.viewCount,
          posts7d: profile.posts7d,
          posts90d: profile.posts90d,
          estImpressions:
            profile.estImpressions > 0
              ? profile.estImpressions
              : profile.videoCount > 0
                ? Math.round(profile.viewCount / profile.videoCount)
                : 0,
          ratePerPostCents: profile.ratePerPostCents,
          industries: profile.industries ?? [],
          cardSlug: profile.cardSlug,
          bio: profile.bio,
        },
      };
    },
  );
};

export default publicRoutes;

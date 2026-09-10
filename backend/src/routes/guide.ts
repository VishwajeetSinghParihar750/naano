import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { matchTour } from "../services/guide.service.js";

const guideBodySchema = z.object({
  question: z.string().min(1),
});

const guideRoutes: FastifyPluginAsync = async (app) => {
  app.post("/guide", async (req, reply) => {
    const parsed = guideBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }

    const match = await matchTour(parsed.data.question);
    return reply.send(match);
  });
};

export default guideRoutes;

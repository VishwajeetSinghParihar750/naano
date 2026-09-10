import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireUser, requireRole } from "../lib/auth.js";
import { creatorService, DomainError } from "../services/creator.service.js";

const updateMeSchema = z
  .object({
    ratePerPostCents: z.number().int().nonnegative().optional(),
    headline: z.string().optional(),
    niche: z.string().optional(),
    country: z.string().optional(),
    bio: z.string().nullable().optional(),
    cardPublished: z.boolean().optional(),
    name: z.string().trim().min(1).optional(),
  })
  .strict();

const deliverableSchema = z.object({
  draftUrl: z.string().url(),
});

function sendDomainError(reply: Parameters<typeof requireRole>[2], err: unknown) {
  if (err instanceof DomainError) {
    return reply
      .code(err.status)
      .send({ error: { code: err.code, message: err.message } });
  }
  throw err;
}

const creatorRoutes: FastifyPluginAsync = async (app) => {
  app.get("/creator/me", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    try {
      const profile = await creatorService.getMe(user.id);
      return reply.send({ profile });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.patch("/creator/me", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const profile = await creatorService.updateMe(user.id, parsed.data);
      return reply.send({ profile });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/creator/opportunities", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    try {
      const opportunities = await creatorService.listOpportunities(user.id);
      return reply.send({ opportunities });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/creator/collaborations", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    try {
      const collaborations = await creatorService.listCollaborations(user.id);
      return reply.send({ collaborations });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/creator/collaborations/:id/accept", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    const { id } = req.params as { id: string };
    try {
      const collaboration = await creatorService.accept(user.id, id);
      return reply.send({ collaboration });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/creator/collaborations/:id/decline", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    const { id } = req.params as { id: string };
    try {
      const collaboration = await creatorService.decline(user.id, id);
      return reply.send({ collaboration });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/creator/collaborations/:id/deliverable", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    const parsed = deliverableSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    const { id } = req.params as { id: string };
    try {
      const result = await creatorService.submitDeliverable(
        user.id,
        id,
        parsed.data.draftUrl,
      );
      return reply.send(result);
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });
};

export default creatorRoutes;

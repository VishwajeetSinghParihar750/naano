import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireUser, requireRole } from "../lib/auth.js";
import { brandService, DomainError } from "../services/brand.service.js";

const createCampaignSchema = z
  .object({
    title: z.string().trim().min(1),
    brief: z.string().trim().min(1),
    budgetCents: z.number().int().nonnegative(),
  })
  .strict();

const inviteSchema = z
  .object({
    creatorProfileId: z.string().uuid(),
  })
  .strict();

function sendDomainError(reply: Parameters<typeof requireRole>[2], err: unknown) {
  if (err instanceof DomainError) {
    return reply
      .code(err.status)
      .send({ error: { code: err.code, message: err.message } });
  }
  throw err;
}

const brandRoutes: FastifyPluginAsync = async (app) => {
  app.get("/brand/me", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    try {
      const profile = await brandService.getMe(user.id);
      return reply.send({ profile });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/brand/campaigns", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    try {
      const campaigns = await brandService.listCampaigns(user.id);
      return reply.send({ campaigns });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/campaigns", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const parsed = createCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const campaign = await brandService.createCampaign(user.id, parsed.data);
      return reply.send({ campaign });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/brand/creators", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    try {
      const creators = await brandService.listCreators(user.id);
      return reply.send({ creators });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/campaigns/:id/invite", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const parsed = inviteSchema.safeParse(req.body);
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
      const collaboration = await brandService.invite(
        user.id,
        id,
        parsed.data.creatorProfileId,
      );
      return reply.send({ collaboration });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/brand/collaborations", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    try {
      const collaborations = await brandService.listCollaborations(user.id);
      return reply.send({ collaborations });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/collaborations/:id/approve", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const { id } = req.params as { id: string };
    try {
      const collaboration = await brandService.approve(user.id, id);
      return reply.send({ collaboration });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/collaborations/:id/mark-paid", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const { id } = req.params as { id: string };
    try {
      const collaboration = await brandService.markPaid(user.id, id);
      return reply.send({ collaboration });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });
};

export default brandRoutes;

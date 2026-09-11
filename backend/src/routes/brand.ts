import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireUser, requireRole } from "../lib/auth.js";
import { httpUrl, optionalHttpUrl } from "../lib/http-url.js";
import { SESSION_COOKIE, clearedCookieOptions } from "../lib/session.js";
import { brandService, DomainError } from "../services/brand.service.js";

/** Prisma Int / Postgres integer max (signed 32-bit). */
const PRISMA_INT_MAX = 2_147_483_647;

const createCampaignSchema = z
  .object({
    title: z.string().trim().min(1),
    brief: z.string().trim().min(1),
    budgetCents: z.number().int().nonnegative(),
    status: z.enum(["draft", "active"]).optional(),
  })
  .strict();

const inviteSchema = z
  .object({
    creatorProfileId: z.string().uuid(),
    postCount: z.union([z.literal(1), z.literal(3)]).optional(),
  })
  .strict();

const analyzeSchema = z
  .object({
    websiteUrl: httpUrl,
  })
  .strict();

const aiDraftSchema = z
  .object({
    prompt: z.string().trim().min(1).max(4000),
  })
  .strict();

const fromLinkSchema = z
  .object({
    sourceUrl: z
      .string()
      .trim()
      .min(1)
      .max(2000)
      .refine(
        (v) => {
          if (/^[a-z][a-z0-9+.-]*:/i.test(v) && !/^https?:\/\//i.test(v)) {
            return false;
          }
          try {
            const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
            return u.protocol === "http:" || u.protocol === "https:";
          } catch {
            return false;
          }
        },
        { message: "URL must use http or https" },
      ),
  })
  .strict();

const createFromDraftSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    destinationUrl: z.string().trim().pipe(httpUrl),
    icp: z.string().trim().min(1).max(2000),
    oneClaim: z.string().trim().min(1).max(1000),
    mustNots: z.string().trim().min(1).max(1000),
    budgetCents: z.number().int().nonnegative().optional(),
    status: z.enum(["draft", "active"]).optional(),
  })
  .strict();

const completeOnboardingSchema = z
  .object({
    valueProp: z.string().optional(),
    company: z.string().optional(),
    icp: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
        }),
      )
      .optional(),
  })
  .strict();

const topupSchema = z
  .object({
    amountCents: z
      .number()
      .int()
      .positive()
      .max(PRISMA_INT_MAX, {
        message: "Amount exceeds maximum wallet top-up",
      }),
  })
  .strict();

function sendDomainError(
  reply: {
    code: (n: number) => { send: (b: unknown) => unknown };
  },
  err: unknown,
) {
  if (err instanceof DomainError) {
    return reply
      .code(err.status)
      .send({ error: { code: err.code, message: err.message } });
  }
  throw err;
}

const updateMeSchema = z
  .object({
    company: z.string().trim().min(1).max(120).optional(),
    website: optionalHttpUrl.optional(),
    valueProp: z.union([z.string().max(4000), z.null()]).optional(),
  })
  .strict();

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

  app.patch("/brand/me", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
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
      const body = parsed.data;
      const profile = await brandService.updateMe(user.id, {
        company: body.company,
        website:
          body.website === undefined
            ? undefined
            : body.website === ""
              ? null
              : body.website,
        valueProp: body.valueProp,
      });
      return reply.send({ profile });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.delete("/brand/me", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    try {
      await brandService.deleteAccount(user.id);
      reply.clearCookie(SESSION_COOKIE, clearedCookieOptions());
      return reply.code(204).send();
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/onboarding/analyze", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const profile = await brandService.analyzeWebsite(
        user.id,
        parsed.data.websiteUrl,
      );
      return reply.send({ profile });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/onboarding/complete", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const parsed = completeOnboardingSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const profile = await brandService.completeOnboarding(
        user.id,
        parsed.data,
      );
      return reply.send({ profile });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/brand/overview", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    try {
      const overview = await brandService.getOverview(user.id);
      return reply.send({ overview });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/brand/wallet", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    try {
      const wallet = await brandService.getWallet(user.id);
      return reply.send({ wallet });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/wallet/topup", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const parsed = topupSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const result = await brandService.topup(user.id, parsed.data.amountCents);
      return reply.send(result);
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

  app.post("/brand/campaigns/ai-draft", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const parsed = aiDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const draft = await brandService.draftCampaignAi(
        user.id,
        parsed.data.prompt,
      );
      return reply.send({ draft });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/campaigns/from-link", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const parsed = fromLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const result = await brandService.recoverCampaignFromLink(
        user.id,
        parsed.data.sourceUrl,
      );
      return reply.send(result);
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/brand/campaigns/from-draft", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const parsed = createFromDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const brief = brandService.composeCampaignBrief(parsed.data);
      const campaign = await brandService.createCampaign(user.id, {
        title: parsed.data.title,
        brief,
        budgetCents: parsed.data.budgetCents ?? 250000,
        status: parsed.data.status ?? "draft",
      });
      return reply.send({ campaign });
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

  app.post("/brand/campaigns/:id/activate", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "brand", reply)) return;
    const { id } = req.params as { id: string };
    try {
      const campaign = await brandService.activateCampaign(user.id, id);
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
        parsed.data.postCount ?? 1,
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

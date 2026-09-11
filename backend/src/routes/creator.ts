import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requireUser, requireRole } from "../lib/auth.js";
import { SESSION_COOKIE, clearedCookieOptions } from "../lib/session.js";
import { httpUrl, optionalHttpUrl } from "../lib/http-url.js";
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
    industries: z.array(z.string()).max(3).optional(),
    linkedinUrl: optionalHttpUrl.optional(),
    youtubeUrl: optionalHttpUrl.optional(),
    xUrl: optionalHttpUrl.optional(),
    registrationCountry: z.string().nullable().optional(),
    isRegisteredBusiness: z.boolean().nullable().optional(),
    legalName: z.string().nullable().optional(),
    legalAddress: z.string().nullable().optional(),
    taxSelfDeclared: z.boolean().optional(),
    invoiceAuthorized: z.boolean().optional(),
    bankDetails: z
      .object({
        accountHolder: z.string().optional(),
        iban: z.string().optional(),
        bankName: z.string().optional(),
      })
      .nullable()
      .optional(),
    followers: z.number().int().nonnegative().optional(),
  })
  .strict();

const deliverableSchema = z.object({
  draftUrl: httpUrl,
});

const linkedinAnalyzeSchema = z
  .object({
    linkedinUrl: z.string().trim().min(1),
  })
  .strict();

const youtubeAnalyzeSchema = z
  .object({
    youtubeUrl: z.string().trim().min(1),
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

function normalizeOptionalUrl(value: string | null | undefined) {
  if (value === "") return null;
  return value;
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
      const body = parsed.data;
      const profile = await creatorService.updateMe(user.id, {
        ...body,
        linkedinUrl: normalizeOptionalUrl(body.linkedinUrl),
        youtubeUrl: normalizeOptionalUrl(body.youtubeUrl),
        xUrl: normalizeOptionalUrl(body.xUrl),
      });
      return reply.send({ profile });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/creator/onboarding/youtube", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    const parsed = youtubeAnalyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const result = await creatorService.analyzeYouTube(
        user.id,
        parsed.data.youtubeUrl,
      );
      return reply.send(result);
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/creator/onboarding/linkedin", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    const parsed = linkedinAnalyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: "invalid_input",
          message: parsed.error.issues[0]?.message ?? "Invalid input",
        },
      });
    }
    try {
      const result = await creatorService.analyzeLinkedIn(
        user.id,
        parsed.data.linkedinUrl,
      );
      return reply.send(result);
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post("/creator/onboarding/complete", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    try {
      const profile = await creatorService.completeOnboarding(user.id);
      return reply.send({ profile });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/creator/earnings", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    try {
      const earnings = await creatorService.getEarnings(user.id);
      return reply.send({ earnings });
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.delete("/creator/me", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    try {
      await creatorService.deleteAccount(user.id);
      reply.clearCookie(SESSION_COOKIE, clearedCookieOptions());
      return reply.code(204).send();
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get("/creator/opportunities", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    if (!requireRole(user, "creator", reply)) return;
    try {
      const result = await creatorService.listOpportunities(user.id);
      // Keep backwards-compatible shape plus gate metadata.
      return reply.send(result);
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

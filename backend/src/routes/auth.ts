import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authService, AuthError } from "../services/auth.service.js";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  clearedCookieOptions,
  sessionValueForUser,
} from "../lib/session.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["creator", "brand"]),
  name: z.string().trim().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: "invalid_input", message: parsed.error.issues[0]?.message ?? "Invalid input" } });
    }
    try {
      const user = await authService.register(parsed.data);
      reply.setCookie(
        SESSION_COOKIE,
        sessionValueForUser(user.id),
        { ...sessionCookieOptions(), signed: true },
      );
      return reply.code(201).send({ user });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.code(err.status).send({ error: { code: err.code, message: err.message } });
      }
      throw err;
    }
  });

  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { code: "invalid_input", message: "Invalid input" } });
    }
    try {
      const user = await authService.login(parsed.data);
      reply.setCookie(
        SESSION_COOKIE,
        sessionValueForUser(user.id),
        { ...sessionCookieOptions(), signed: true },
      );
      return reply.code(200).send({ user });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.code(err.status).send({ error: { code: err.code, message: err.message } });
      }
      throw err;
    }
  });

  app.post("/auth/logout", async (_req, reply) => {
    reply.clearCookie(SESSION_COOKIE, clearedCookieOptions());
    return reply.code(204).send();
  });
};

export default authRoutes;

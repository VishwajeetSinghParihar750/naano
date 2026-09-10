import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "./prisma.js";
import { SESSION_COOKIE } from "./session.js";

export type SessionUser = {
  id: string;
  email: string;
  role: "creator" | "brand";
};

export function readSessionUserId(req: FastifyRequest): string | null {
  const raw = req.cookies[SESSION_COOKIE];
  if (!raw) return null;
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid || unsigned.value === null) return null;
  return unsigned.value;
}

export async function getSessionUser(
  req: FastifyRequest,
): Promise<SessionUser | null> {
  const userId = readSessionUserId(req);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) return null;
  return { id: user.id, email: user.email, role: user.role };
}

/**
 * preHandler that requires an authenticated user. On failure it replies 401 in
 * the standard error shape and returns null so the caller can stop.
 */
export async function requireUser(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<SessionUser | null> {
  const user = await getSessionUser(req);
  if (!user) {
    reply
      .code(401)
      .send({ error: { code: "unauthorized", message: "Not signed in" } });
    return null;
  }
  return user;
}

export function requireRole(
  user: SessionUser,
  role: "creator" | "brand",
  reply: FastifyReply,
): boolean {
  if (user.role !== role) {
    reply
      .code(403)
      .send({ error: { code: "forbidden", message: "Wrong role" } });
    return false;
  }
  return true;
}

import type { CookieSerializeOptions } from "@fastify/cookie";

export const SESSION_COOKIE = "naano_session";

const isProd = process.env.NODE_ENV === "production";

/**
 * Cookie options. In production the frontend (Vercel) and API (Railway) are on
 * different sites, so the session cookie must be SameSite=None; Secure. In dev
 * they share localhost, so Lax works without HTTPS.
 */
export function sessionCookieOptions(): CookieSerializeOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export function clearedCookieOptions(): CookieSerializeOptions {
  return { ...sessionCookieOptions(), maxAge: 0 };
}

/**
 * The signed cookie value is the user id. @fastify/cookie signs/verifies it with
 * SESSION_SECRET, so a tampered id is rejected. Opaque to the browser; no JWT in JS.
 */
export function sessionValueForUser(userId: string): string {
  return userId;
}

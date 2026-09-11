import { z } from "zod";

/** True only for http: / https: URLs (rejects javascript:, data:, etc.). */
export function isHttpOrHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const httpUrl = z
  .string()
  .url()
  .refine(isHttpOrHttpsUrl, {
    message: "URL must use http or https",
  });

/** Optional profile URL fields: empty string / null clear the value. */
export const optionalHttpUrl = z.union([httpUrl, z.literal(""), z.null()]);

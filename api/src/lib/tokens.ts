import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

export const ACCESS_TTL = "15m";
export const REFRESH_TTL_DAYS = 30;

interface AccessPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessPayload, env.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function verifyAccessToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessPayload;
    return payload.sub ?? null;
  } catch {
    return null; // expired or tampered — the client should refresh
  }
}

/** Opaque, high-entropy, never a JWT: it must be revocable server-side. */
export function createRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

/** Only the hash is stored, so a database leak yields no usable sessions. */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

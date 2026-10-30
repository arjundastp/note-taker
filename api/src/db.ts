import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// A single client per process. tsx watch re-imports modules on change, so in
// dev the instance is parked on globalThis to avoid leaking connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV === "development") globalForPrisma.prisma = prisma;

// Health checks poll, so the result is cached briefly.
const PING_TTL_MS = 10_000;
let lastPing: { at: number; ok: boolean } | null = null;

export async function pingDatabase(): Promise<boolean> {
  const now = Date.now();
  if (lastPing && now - lastPing.at < PING_TTL_MS) return lastPing.ok;

  let ok = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    ok = true;
  } catch {
    ok = false;
  }
  lastPing = { at: now, ok };
  return ok;
}

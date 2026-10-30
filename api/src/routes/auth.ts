import { Router } from "express";
import { prisma } from "../db.js";
import {
  burnTimingBudget,
  hashPassword,
  verifyPassword,
} from "../lib/password.js";
import { loginSchema, refreshSchema, registerSchema } from "../lib/schemas.js";
import {
  createRefreshToken,
  hashRefreshToken,
  refreshExpiry,
  signAccessToken,
} from "../lib/tokens.js";
import { requireAuth, userIdOf } from "../middleware/auth.js";
import { asyncRoute, HttpError } from "../middleware/error.js";
import { authLimiter } from "../middleware/rateLimit.js";

export const authRouter = Router();

/** Issues a fresh pair and records the device. */
async function startSession(userId: string, userAgent?: string) {
  const refreshToken = createRefreshToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiry(),
      userAgent: userAgent?.slice(0, 200),
    },
  });
  return { accessToken: signAccessToken(userId), refreshToken };
}

const publicUser = (u: { id: string; email: string }) => ({
  id: u.id,
  email: u.email,
});

authRouter.post(
  "/register",
  authLimiter,
  asyncRoute(async (req, res) => {
    const { email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(
        409,
        "That email is already registered. Sign in instead.",
        "EMAIL_TAKEN",
      );
    }

    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password) },
    });

    res.status(201).json({
      user: publicUser(user),
      ...(await startSession(user.id, req.headers["user-agent"])),
    });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  asyncRoute(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Same message and timing either way: never reveal which emails exist.
    if (!user) {
      await burnTimingBudget(password);
      throw new HttpError(401, "Wrong email or password", "BAD_CREDENTIALS");
    }
    if (!(await verifyPassword(user.passwordHash, password))) {
      throw new HttpError(401, "Wrong email or password", "BAD_CREDENTIALS");
    }

    res.json({
      user: publicUser(user),
      ...(await startSession(user.id, req.headers["user-agent"])),
    });
  }),
);

authRouter.post(
  "/refresh",
  asyncRoute(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashRefreshToken(refreshToken) },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new HttpError(401, "Your session expired. Sign in again.", "BAD_REFRESH");
    }

    // Rotate: the presented token dies here, so a stolen copy is single-use.
    const next = createRefreshToken();
    await prisma.$transaction([
      prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      prisma.session.create({
        data: {
          userId: session.userId,
          tokenHash: hashRefreshToken(next),
          expiresAt: refreshExpiry(),
          userAgent: session.userAgent,
        },
      }),
    ]);

    res.json({ accessToken: signAccessToken(session.userId), refreshToken: next });
  }),
);

authRouter.post(
  "/logout",
  asyncRoute(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    await prisma.session.updateMany({
      where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.status(204).end();
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: userIdOf(req) } });
    if (!user) throw new HttpError(401, "Sign in to continue");
    res.json({ user: { ...publicUser(user), createdAt: user.createdAt } });
  }),
);

// Delete the signed-in account. Cascades to the user's notes, images and
// sessions (schema onDelete: Cascade). A user can only delete themselves.
authRouter.delete(
  "/me",
  requireAuth,
  asyncRoute(async (req, res) => {
    await prisma.user.delete({ where: { id: userIdOf(req) } });
    res.status(204).end();
  }),
);

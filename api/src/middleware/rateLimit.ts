import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

// The limiter keeps an in-memory count that outlives per-test DB resets, so it
// would trip across a suite. Off in tests; real in dev/prod.
const passthrough: RequestHandler = (_req, _res, next) => next();
const inTest = process.env.NODE_ENV === "test";

/**
 * Login and register are the only endpoints worth guessing at. Keyed on IP
 * *and* the submitted email, so one attacker cannot burn through a list of
 * addresses from one IP, and a shared IP cannot lock out everyone behind it.
 */
export const authLimiter: RequestHandler = inTest
  ? passthrough
  : rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email : "unknown";
    return `${req.ip}:${email}`;
  },
  message: {
    error: "Too many attempts. Try again in 15 minutes.",
    code: "RATE_LIMITED",
  },
});

/** A looser ceiling for everything else, mostly to blunt runaway clients. */
export const apiLimiter: RequestHandler = inTest
  ? passthrough
  : rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    });

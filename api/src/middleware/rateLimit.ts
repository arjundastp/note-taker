import rateLimit from "express-rate-limit";

/**
 * Login and register are the only endpoints worth guessing at. Keyed on IP
 * *and* the submitted email, so one attacker cannot burn through a list of
 * addresses from one IP, and a shared IP cannot lock out everyone behind it.
 */
export const authLimiter = rateLimit({
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
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

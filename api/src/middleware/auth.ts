import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/tokens.js";
import { HttpError } from "./error.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** Puts req.userId in place, or refuses. Every route scopes queries by it. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Sign in to continue", "NO_TOKEN");
  }

  const userId = verifyAccessToken(header.slice(7));
  if (!userId) {
    // The client's interceptor reads this code and tries a refresh.
    throw new HttpError(401, "Your session expired", "TOKEN_EXPIRED");
  }

  req.userId = userId;
  next();
}

/** Narrow req.userId to a string after requireAuth has run. */
export function userIdOf(req: Request): string {
  if (!req.userId) throw new HttpError(401, "Sign in to continue");
  return req.userId;
}

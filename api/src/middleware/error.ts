import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { ZodError } from "zod";
import { env } from "../env.js";

/** Thrown deliberately by route handlers. Anything else is a 500. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    res.status(400).json({ error: "Check the highlighted fields", fields });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  // The raw body parser throws a 413 with `type: "entity.too.large"`.
  if (
    typeof err === "object" &&
    err !== null &&
    (err as { type?: string }).type === "entity.too.large"
  ) {
    res.status(413).json({ error: "File too large", code: "TOO_LARGE" });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error:
      env.NODE_ENV === "production"
        ? "Something went wrong on our side"
        : String(err),
  });
}

/**
 * Wraps an async handler so a rejected promise reaches errorHandler. Express 4
 * does not await handlers, so without this an async throw hangs the request.
 */
export function asyncRoute(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

import cors from "cors";
import express from "express";
import helmet from "helmet";
import { databaseConfigured, env } from "./env.js";
import { pingDatabase } from "./db.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { authRouter } from "./routes/auth.js";

export const app = express();

app.set("trust proxy", 1); // a TLS-terminating proxy sits in front of us
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Native app requests arrive with no Origin header.
      if (!origin) return cb(null, true);
      if (env.CORS_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} is not allowed`));
    },
    credentials: true,
  }),
);

/** Liveness. Always 200 while the process is up. */
app.get("/healthz", async (_req, res) => {
  const db = !databaseConfigured
    ? "not-configured"
    : (await pingDatabase())
      ? "up"
      : "down";
  res.json({ ok: true, service: "notes-api", env: env.NODE_ENV, db });
});

/** Readiness. 503 when the database is unreachable. */
app.get("/readyz", async (_req, res) => {
  const up = databaseConfigured && (await pingDatabase());
  res.status(up ? 200 : 503).json({ ready: up });
});

// JSON for most routes; the sketch image PUT uses a raw parser on its own path.
app.use(express.json({ limit: "1mb" }));

app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
// Router mounted in a later task: /api/notes

app.use(notFound);
app.use(errorHandler);

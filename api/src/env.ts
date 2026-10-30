// Local dev reads .env; in production the real environment variables are set
// and dotenv is a no-op when no file is present. Tests load .env.test.
import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Neon: pooled serves requests, direct runs migrations.
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:8081")
    .transform((v) =>
      v
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    ),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

// A connection string copied from .env.example and never edited passes an
// "is it set?" check and then fails on every request. Catch it here.
const PLACEHOLDER_MARKERS = ["ep-xxx", "USER:PASS", "user:pass", "REGION.aws"];

export const databaseUrlIsPlaceholder =
  Boolean(env.DATABASE_URL) &&
  PLACEHOLDER_MARKERS.some((m) => env.DATABASE_URL!.includes(m));

export const databaseConfigured =
  Boolean(env.DATABASE_URL) && !databaseUrlIsPlaceholder;

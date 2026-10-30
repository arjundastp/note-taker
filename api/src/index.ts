import { app } from "./app.js";
import { prisma } from "./db.js";
import { env, databaseConfigured, databaseUrlIsPlaceholder } from "./env.js";

const server = app.listen(env.PORT, () => {
  console.log(`notes-api listening on http://localhost:${env.PORT}`);
  if (databaseUrlIsPlaceholder) {
    console.warn("⚠️  DATABASE_URL is still the placeholder from .env.example.");
  } else if (!databaseConfigured) {
    console.warn("⚠️  DATABASE_URL is unset — running without a database.");
  }
});

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down.`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

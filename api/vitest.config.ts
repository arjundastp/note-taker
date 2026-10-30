import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Tests touch a shared Postgres; run files serially to avoid cross-talk.
    fileParallelism: false,
    setupFiles: ["./test/setup.ts"],
  },
});

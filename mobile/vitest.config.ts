import { defineConfig } from "vitest/config";
// Pure-logic tests only (api core, share helpers). RN/Expo UI is verified on device.
export default defineConfig({
  test: { environment: "node", include: ["test/**/*.test.ts"] },
});

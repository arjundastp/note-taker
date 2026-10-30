import { describe, expect, it } from "vitest";
import { SessionExpired } from "../src/api/core";
import { trySave } from "../src/lib/autosave";

describe("trySave", () => {
  it("reports saved on success", async () => {
    expect(await trySave(async () => {})).toBe("saved");
  });

  it("reports failed on a transient error (so the caller keeps retrying)", async () => {
    expect(
      await trySave(async () => {
        throw new Error("network down");
      }),
    ).toBe("failed");
  });

  it("reports session-expired (terminal) when the session is gone", async () => {
    expect(
      await trySave(async () => {
        throw new SessionExpired();
      }),
    ).toBe("session-expired");
  });
});

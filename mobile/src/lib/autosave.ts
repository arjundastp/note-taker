import { SessionExpired } from "../api/core";

export type SaveOutcome = "saved" | "failed" | "session-expired";

/**
 * Runs a save and classifies the result, so a transient failure is never
 * mistaken for success. The caller advances its "last saved" marker only on
 * "saved"; on "failed" it leaves the marker alone so the next autosave retries
 * (anti-goal: never silently lose a note). "session-expired" is terminal — the
 * auth layer routes to login, so no retry.
 */
export async function trySave(save: () => Promise<unknown>): Promise<SaveOutcome> {
  try {
    await save();
    return "saved";
  } catch (e) {
    return e instanceof SessionExpired ? "session-expired" : "failed";
  }
}

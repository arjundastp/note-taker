import bcrypt from "bcryptjs";

// bcrypt (pure JS) rather than a native argon2 binary, so it runs anywhere —
// notably on serverless (Vercel), where bundling a platform .node binary is
// unreliable. 12 rounds is the common cost floor.
const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  digest: string,
  plain: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, digest);
  } catch {
    return false; // malformed digest — a failed login, never a 500
  }
}

/**
 * A real bcrypt comparison against a throwaway digest, used when the email does
 * not exist, so "unknown email" and "wrong password" take similar time and
 * never reveal which addresses are registered.
 */
const DECOY = hashPassword("decoy-password-never-matches");
export async function burnTimingBudget(plain: string): Promise<void> {
  await verifyPassword(await DECOY, plain);
}

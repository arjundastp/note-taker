import { hash, verify } from "@node-rs/argon2";

// argon2id with OWASP's recommended floor. @node-rs ships prebuilt binaries,
// so there is no node-gyp toolchain to break on a deploy.
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(
  digest: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(digest, plain, OPTIONS);
  } catch {
    return false; // malformed digest — a failed login, never a 500
  }
}

/**
 * A real argon2 verification against a throwaway digest, used when the email
 * does not exist, so "unknown email" and "wrong password" take the same time
 * and never reveal which addresses are registered.
 */
const DECOY = hashPassword("decoy-password-never-matches");
export async function burnTimingBudget(plain: string): Promise<void> {
  await verifyPassword(await DECOY, plain);
}

import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/db.js";

/** Wipe all rows between tests. Order respects FKs (cascade also covers it). */
export async function resetDb() {
  await prisma.$transaction([
    prisma.noteImage.deleteMany(),
    prisma.note.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export interface Account {
  email: string;
  accessToken: string;
  refreshToken: string;
  userId: string;
}

/** Register a fresh user and return its tokens. */
export async function makeUser(email: string, password = "password123"): Promise<Account> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password });
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    email,
    accessToken: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    userId: res.body.user.id,
  };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

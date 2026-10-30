import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { bearer, resetDb } from "./helpers.js";

beforeEach(resetDb);

describe("auth", () => {
  it("registers a new email and returns tokens", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@example.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("a@example.com");
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
  });

  it("rejects a duplicate email", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password123" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EMAIL_TAKEN");
  });

  it("rejects a wrong password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "wp@example.com", password: "password123" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wp@example.com", password: "wrongpass1" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("BAD_CREDENTIALS");
  });

  it("rejects an unknown email with the same message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("BAD_CREDENTIALS");
  });

  it("rotates refresh tokens — the old one stops working", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email: "rot@example.com", password: "password123" });
    const old = reg.body.refreshToken;

    const first = await request(app).post("/api/auth/refresh").send({ refreshToken: old });
    expect(first.status).toBe(200);
    expect(first.body.accessToken).toBeTruthy();
    expect(first.body.refreshToken).not.toBe(old);

    const reuse = await request(app).post("/api/auth/refresh").send({ refreshToken: old });
    expect(reuse.status).toBe(401);
  });

  it("serves /me with a token and refuses without one", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email: "me@example.com", password: "password123" });
    const ok = await request(app).get("/api/auth/me").set(bearer(reg.body.accessToken));
    expect(ok.status).toBe(200);
    expect(ok.body.user.email).toBe("me@example.com");

    const no = await request(app).get("/api/auth/me");
    expect(no.status).toBe(401);
  });
});

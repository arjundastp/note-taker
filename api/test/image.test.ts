import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { bearer, makeUser, resetDb } from "./helpers.js";

beforeEach(resetDb);

// A 1x1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function makeSketch(token: string) {
  const res = await request(app)
    .post("/api/notes")
    .set(bearer(token))
    .send({ kind: "sketch" });
  return res.body.id as string;
}

describe("sketch image", () => {
  it("stores and returns the PNG bytes", async () => {
    const a = await makeUser("a@example.com");
    const id = await makeSketch(a.accessToken);

    const put = await request(app)
      .put(`/api/notes/${id}/image`)
      .set(bearer(a.accessToken))
      .set("Content-Type", "image/png")
      .send(PNG);
    expect(put.status).toBe(200);

    const get = await request(app)
      .get(`/api/notes/${id}/image`)
      .set(bearer(a.accessToken))
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(get.status).toBe(200);
    expect(get.headers["content-type"]).toContain("image/png");
    expect(Buffer.compare(get.body, PNG)).toBe(0);
  });

  it("flips the note to kind=sketch and hasImage in the list", async () => {
    const a = await makeUser("a@example.com");
    const id = await makeSketch(a.accessToken);
    await request(app)
      .put(`/api/notes/${id}/image`)
      .set(bearer(a.accessToken))
      .set("Content-Type", "image/png")
      .send(PNG);

    const list = await request(app).get("/api/notes").set(bearer(a.accessToken));
    const row = list.body.find((n: { id: string }) => n.id === id);
    expect(row.kind).toBe("sketch");
    expect(row.hasImage).toBe(true);
  });

  it("isolates images per user (404 across users)", async () => {
    const a = await makeUser("a@example.com");
    const b = await makeUser("b@example.com");
    const id = await makeSketch(a.accessToken);
    await request(app)
      .put(`/api/notes/${id}/image`)
      .set(bearer(a.accessToken))
      .set("Content-Type", "image/png")
      .send(PNG);

    const put = await request(app)
      .put(`/api/notes/${id}/image`)
      .set(bearer(b.accessToken))
      .set("Content-Type", "image/png")
      .send(PNG);
    const get = await request(app)
      .get(`/api/notes/${id}/image`)
      .set(bearer(b.accessToken));
    expect(put.status).toBe(404);
    expect(get.status).toBe(404);
  });

  it("rejects a non-PNG upload with 415", async () => {
    const a = await makeUser("a@example.com");
    const id = await makeSketch(a.accessToken);
    const res = await request(app)
      .put(`/api/notes/${id}/image`)
      .set(bearer(a.accessToken))
      .set("Content-Type", "text/plain")
      .send("not a png");
    expect(res.status).toBe(415);
  });
});

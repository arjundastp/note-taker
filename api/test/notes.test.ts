import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { bearer, makeUser, resetDb } from "./helpers.js";

beforeEach(resetDb);

async function create(token: string, body?: string, kind = "text") {
  const res = await request(app)
    .post("/api/notes")
    .set(bearer(token))
    .send({ kind, bodyHtml: body });
  return res;
}

describe("notes", () => {
  it("derives the title from the first line of the body", async () => {
    const a = await makeUser("a@example.com");
    const res = await create(a.accessToken, "<h1>Shopping</h1><p>milk</p>");
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Shopping");
  });

  it("falls back to Untitled for an empty body", async () => {
    const a = await makeUser("a@example.com");
    const res = await create(a.accessToken, "");
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Untitled");
  });

  it("lists pinned notes first, then newest", async () => {
    const a = await makeUser("a@example.com");
    const n1 = (await create(a.accessToken, "one")).body;
    const n2 = (await create(a.accessToken, "two")).body;
    const n3 = (await create(a.accessToken, "three")).body;

    await request(app)
      .patch(`/api/notes/${n2.id}/pin`)
      .set(bearer(a.accessToken))
      .send({ isPinned: true });

    const list = await request(app).get("/api/notes").set(bearer(a.accessToken));
    expect(list.status).toBe(200);
    const ids = list.body.map((n: { id: string }) => n.id);
    expect(ids[0]).toBe(n2.id); // pinned first
    expect(ids.slice(1)).toEqual([n3.id, n1.id]); // rest newest-first
  });

  it("updating the body re-derives title and moves the note to the top", async () => {
    const a = await makeUser("a@example.com");
    const n1 = (await create(a.accessToken, "first")).body;
    const n2 = (await create(a.accessToken, "second")).body;

    const upd = await request(app)
      .patch(`/api/notes/${n1.id}`)
      .set(bearer(a.accessToken))
      .send({ bodyHtml: "first edited" });
    expect(upd.status).toBe(200);
    expect(upd.body.title).toBe("first edited");

    const list = await request(app).get("/api/notes").set(bearer(a.accessToken));
    expect(list.body[0].id).toBe(n1.id); // n1 is now newest
    expect(list.body[1].id).toBe(n2.id);
  });

  it("isolates notes per user (404 across users)", async () => {
    const a = await makeUser("a@example.com");
    const b = await makeUser("b@example.com");
    const note = (await create(a.accessToken, "secret")).body;

    const get = await request(app).get(`/api/notes/${note.id}`).set(bearer(b.accessToken));
    const patch = await request(app)
      .patch(`/api/notes/${note.id}`)
      .set(bearer(b.accessToken))
      .send({ bodyHtml: "hacked" });
    const del = await request(app).delete(`/api/notes/${note.id}`).set(bearer(b.accessToken));

    expect(get.status).toBe(404);
    expect(patch.status).toBe(404);
    expect(del.status).toBe(404);
  });

  it("deletes a note", async () => {
    const a = await makeUser("a@example.com");
    const note = (await create(a.accessToken, "bye")).body;
    const del = await request(app).delete(`/api/notes/${note.id}`).set(bearer(a.accessToken));
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/notes/${note.id}`).set(bearer(a.accessToken));
    expect(get.status).toBe(404);
  });
});

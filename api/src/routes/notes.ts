import express, { Router } from "express";
import { prisma } from "../db.js";
import {
  createNoteSchema,
  pinSchema,
  updateNoteSchema,
} from "../lib/schemas.js";
import { deriveTitle } from "../lib/title.js";
import { requireAuth, userIdOf } from "../middleware/auth.js";
import { asyncRoute, HttpError } from "../middleware/error.js";

export const notesRouter = Router();
notesRouter.use(requireAuth);

/** Confirms ownership; 404 (not 403) so an id for another user leaks nothing. */
async function ownedNote(userId: string, id: string) {
  const note = await prisma.note.findFirst({ where: { id, userId } });
  if (!note) throw new HttpError(404, "Note not found");
  return note;
}

// List — pinned first, then newest. No body, but a hasImage flag.
notesRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const notes = await prisma.note.findMany({
      where: { userId: userIdOf(req) },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        kind: true,
        title: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        image: { select: { noteId: true } },
      },
    });
    res.json(
      notes.map(({ image, ...n }) => ({ ...n, hasImage: image !== null })),
    );
  }),
);

notesRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const { kind, bodyHtml } = createNoteSchema.parse(req.body);
    const note = await prisma.note.create({
      data: { userId: userIdOf(req), kind, bodyHtml, title: deriveTitle(bodyHtml) },
    });
    res.status(201).json(note);
  }),
);

notesRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const note = await ownedNote(userIdOf(req), req.params.id);
    res.json(note);
  }),
);

notesRouter.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const { bodyHtml } = updateNoteSchema.parse(req.body);
    await ownedNote(userIdOf(req), req.params.id);
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: { bodyHtml, title: deriveTitle(bodyHtml) },
    });
    res.json(note);
  }),
);

notesRouter.patch(
  "/:id/pin",
  asyncRoute(async (req, res) => {
    const { isPinned } = pinSchema.parse(req.body);
    await ownedNote(userIdOf(req), req.params.id);
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: { isPinned },
    });
    res.json(note);
  }),
);

// Sketch image: raw PNG bytes in, same bytes out. Raw parser only here.
const rawPng = express.raw({ type: "image/png", limit: "4mb" });

notesRouter.put(
  "/:id/image",
  rawPng,
  asyncRoute(async (req, res) => {
    if (!req.is("image/png") || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new HttpError(415, "Send a PNG image", "BAD_IMAGE");
    }
    await ownedNote(userIdOf(req), req.params.id);
    // Prisma's Bytes field types as Uint8Array<ArrayBuffer>; normalize from Buffer.
    const bytes = new Uint8Array(req.body);
    await prisma.$transaction([
      prisma.noteImage.upsert({
        where: { noteId: req.params.id },
        create: { noteId: req.params.id, bytes, mimeType: "image/png" },
        update: { bytes },
      }),
      prisma.note.update({
        where: { id: req.params.id },
        data: { kind: "sketch" }, // also bumps updatedAt
      }),
    ]);
    res.json({ ok: true });
  }),
);

notesRouter.get(
  "/:id/image",
  asyncRoute(async (req, res) => {
    await ownedNote(userIdOf(req), req.params.id);
    const img = await prisma.noteImage.findUnique({
      where: { noteId: req.params.id },
    });
    if (!img) throw new HttpError(404, "No image");
    res.setHeader("Content-Type", img.mimeType);
    res.send(Buffer.from(img.bytes));
  }),
);

notesRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    await ownedNote(userIdOf(req), req.params.id);
    await prisma.note.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

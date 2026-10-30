import { api, baseUrl, request } from "./client";

export type NoteKind = "text" | "sketch";

export interface NoteListItem {
  id: string;
  kind: NoteKind;
  title: string;
  isPinned: boolean;
  hasImage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  bodyHtml: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const listNotes = () => api<NoteListItem[]>("/api/notes");
export const getNote = (id: string) => api<Note>(`/api/notes/${id}`);

export const createNote = (kind: NoteKind, bodyHtml?: string) =>
  api<Note>("/api/notes", jsonInit("POST", { kind, bodyHtml }));

export const updateNote = (id: string, bodyHtml: string) =>
  api<Note>(`/api/notes/${id}`, jsonInit("PATCH", { bodyHtml }));

export const setPin = (id: string, isPinned: boolean) =>
  api<Note>(`/api/notes/${id}/pin`, jsonInit("PATCH", { isPinned }));

export const deleteNote = (id: string) =>
  api<void>(`/api/notes/${id}`, { method: "DELETE" });

export async function putImage(id: string, bytes: Uint8Array) {
  const res = await request(`/api/notes/${id}/image`, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: bytes as unknown as BodyInit,
  });
  if (!res.ok) throw new Error(`Image upload failed (${res.status})`);
}

export const imageUrl = (id: string) => `${baseUrl}/api/notes/${id}/image`;

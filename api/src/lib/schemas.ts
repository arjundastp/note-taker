import { z } from "zod";

const email = z
  .string()
  .email("Enter a valid email")
  .transform((s) => s.toLowerCase().trim());

const password = z.string().min(8, "Use at least 8 characters");

export const registerSchema = z.object({ email, password });
export const loginSchema = z.object({ email, password });
export const refreshSchema = z.object({ refreshToken: z.string().min(1) });

// Notes (used from Task 3). kind defaults to text; bodyHtml optional.
export const createNoteSchema = z.object({
  kind: z.enum(["text", "sketch"]).default("text"),
  bodyHtml: z.string().optional(),
});
export const updateNoteSchema = z.object({ bodyHtml: z.string().optional() });
export const pinSchema = z.object({ isPinned: z.boolean() });

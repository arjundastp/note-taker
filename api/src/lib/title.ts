/** First non-empty text line of the HTML body, trimmed to 80 chars. */
export function deriveTitle(html?: string | null): string {
  if (!html) return "Untitled";
  const text = html
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ");
  const line = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return line ? line.slice(0, 80) : "Untitled";
}

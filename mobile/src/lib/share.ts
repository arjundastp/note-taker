// HTML (as tentap emits: p / h1-3 / ul / ol / li / strong|b / em|i) into plain
// text or Markdown. A small block scanner — no DOM on React Native.

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

function decode(s: string): string {
  return s.replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m] ?? m);
}

/** Inline formatting → markers (markdown) or stripped (plain). */
function inline(html: string, markdown: boolean): string {
  let s = html;
  if (markdown) {
    s = s
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "**$2**")
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, "*$2*");
  }
  s = s.replace(/<[^>]+>/g, ""); // drop any remaining tags
  return decode(s).replace(/\s+/g, " ").trim();
}

function listItems(inner: string, markdown: boolean, ordered: boolean): string {
  const items: string[] = [];
  const re = /<li>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  let i = 1;
  while ((m = re.exec(inner))) {
    const prefix = ordered ? `${i++}. ` : "- ";
    items.push(prefix + inline(m[1], markdown));
  }
  return items.join("\n");
}

function convert(html: string, markdown: boolean): string {
  const blocks: string[] = [];
  const BLOCK =
    /<(h[1-3])>([\s\S]*?)<\/\1>|<(ul|ol)>([\s\S]*?)<\/\3>|<p>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  let lastIndex = 0;
  let matchedAny = false;

  while ((m = BLOCK.exec(html))) {
    matchedAny = true;
    lastIndex = BLOCK.lastIndex;
    if (m[1]) {
      // heading
      const level = Number(m[1][1]);
      const text = inline(m[2], markdown);
      blocks.push(markdown ? `${"#".repeat(level)} ${text}` : text);
    } else if (m[3]) {
      // list
      blocks.push(listItems(m[4], markdown, m[3].toLowerCase() === "ol"));
    } else {
      // paragraph
      const text = inline(m[5], markdown);
      if (text) blocks.push(text);
    }
  }

  if (!matchedAny) {
    // No block tags — treat the whole thing as one paragraph.
    const text = inline(html, markdown);
    return text;
  }
  void lastIndex;
  return blocks.join(markdown ? "\n\n" : "\n");
}

export const htmlToMarkdown = (html: string) => convert(html, true);
export const htmlToText = (html: string) => convert(html, false);

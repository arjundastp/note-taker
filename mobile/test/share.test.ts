import { describe, expect, it } from "vitest";
import { htmlToMarkdown, htmlToText } from "../src/lib/share";

describe("htmlToMarkdown", () => {
  it("converts headings and bullet lists", () => {
    const html = "<h1>T</h1><ul><li>a</li><li>b</li></ul>";
    expect(htmlToMarkdown(html)).toBe("# T\n\n- a\n- b");
  });

  it("numbers ordered lists", () => {
    expect(htmlToMarkdown("<ol><li>one</li></ol>")).toBe("1. one");
  });

  it("keeps bold and italic markers", () => {
    expect(htmlToMarkdown("<p>a <strong>b</strong> <em>c</em></p>")).toBe("a **b** *c*");
  });
});

describe("htmlToText", () => {
  it("strips formatting but keeps list structure", () => {
    const html = "<h1>T</h1><ul><li>a</li><li>b</li></ul>";
    expect(htmlToText(html)).toBe("T\n- a\n- b");
  });

  it("drops bold/italic markers", () => {
    expect(htmlToText("<p>a <strong>b</strong> <em>c</em></p>")).toBe("a b c");
  });
});

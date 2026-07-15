// Minimal Markdown → Tiptap JSON conversion for saving assistant drafts as
// notes. Handles the subset the assistant emits (headings, bullet/numbered
// lists, bold/italic inline, paragraphs); anything else lands as plain text.

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string }[];
};

function inline(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  // Split on **bold** and *italic* spans, keeping delimiters.
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) nodes.push({ type: "text", text: text.slice(last, m.index) });
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push({ type: "text", text: token.slice(2, -2), marks: [{ type: "bold" }] });
    } else {
      nodes.push({ type: "text", text: token.slice(1, -1), marks: [{ type: "italic" }] });
    }
    last = m.index! + token.length;
  }
  if (last < text.length) nodes.push({ type: "text", text: text.slice(last) });
  return nodes.length ? nodes : [{ type: "text", text: " " }];
}

export function markdownToTiptap(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const doc: TiptapNode[] = [];
  let listItems: TiptapNode[] = [];
  let listType: "bulletList" | "orderedList" | null = null;

  const flushList = () => {
    if (listType && listItems.length) {
      doc.push({ type: listType, content: listItems });
    }
    listItems = [];
    listType = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);

    if (heading) {
      flushList();
      doc.push({
        type: "heading",
        attrs: { level: heading[1].length },
        content: inline(heading[2]),
      });
    } else if (bullet) {
      if (listType !== "bulletList") flushList();
      listType = "bulletList";
      listItems.push({
        type: "listItem",
        content: [{ type: "paragraph", content: inline(bullet[1]) }],
      });
    } else if (ordered) {
      if (listType !== "orderedList") flushList();
      listType = "orderedList";
      listItems.push({
        type: "listItem",
        content: [{ type: "paragraph", content: inline(ordered[1]) }],
      });
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      doc.push({ type: "paragraph", content: inline(line) });
    }
  }
  flushList();

  return JSON.stringify({ type: "doc", content: doc.length ? doc : [{ type: "paragraph" }] });
}

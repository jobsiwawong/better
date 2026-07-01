interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

export function extractPlainText(json: string | null | undefined): string {
  if (!json) return "";
  let doc: TiptapNode;
  try {
    doc = JSON.parse(json);
  } catch {
    return "";
  }

  const parts: string[] = [];
  function walk(node: TiptapNode) {
    if (node.text) parts.push(node.text);
    node.content?.forEach(walk);
  }
  walk(doc);
  return parts.join(" ");
}

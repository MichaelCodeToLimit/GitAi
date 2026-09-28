// Turns GitHub alert blockquotes ("> [!NOTE]") into styled callouts.

type Node = {
  type: string;
  value?: string;
  children?: Node[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

const KINDS: Record<string, string> = {
  NOTE: "Note",
  TIP: "Tip",
  IMPORTANT: "Important",
  WARNING: "Warning",
  CAUTION: "Caution",
};

function visit(node: Node) {
  if (node.type === "blockquote") transform(node);
  node.children?.forEach(visit);
}

function transform(quote: Node) {
  const paragraph = quote.children?.[0];
  const text = paragraph?.type === "paragraph" ? paragraph.children?.[0] : undefined;
  if (!paragraph || text?.type !== "text" || !text.value) return;
  const match = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/.exec(text.value);
  if (!match) return;

  const kind = match[1];
  text.value = text.value.slice(match[0].length);
  if (!text.value) paragraph.children!.shift();
  if (!paragraph.children!.length) quote.children!.shift();

  quote.data = {
    ...quote.data,
    hProperties: { className: ["markdown-alert", `markdown-alert-${kind.toLowerCase()}`] },
  };
  quote.children!.unshift({
    type: "paragraph",
    data: { hProperties: { className: ["markdown-alert-title"] } },
    children: [{ type: "text", value: KINDS[kind] }],
  });
}

export function remarkAlerts() {
  return (tree: Node) => visit(tree);
}

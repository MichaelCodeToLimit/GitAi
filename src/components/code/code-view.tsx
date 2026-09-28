import { useEffect, useState } from "react";
import { canHighlight, highlightToHtml } from "@/lib/highlight";

const MAX_HIGHLIGHT_CHARS = 300_000;

/** A file's contents with line numbers. Renders plain text first, then swaps in highlighting. */
export function CodeView({ code, grammar }: { code: string; grammar?: string }) {
  const text = code.replace(/\r?\n$/, "");
  const [html, setHtml] = useState<{ source: string; html: string } | null>(null);

  useEffect(() => {
    if (!canHighlight(grammar) || text.length > MAX_HIGHLIGHT_CHARS) return;
    let alive = true;
    highlightToHtml(text, grammar)
      .then((result) => {
        if (alive && result) setHtml({ source: text, html: result });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [text, grammar]);

  if (html && html.source === text) {
    return <div className="code-view" dangerouslySetInnerHTML={{ __html: html.html }} />;
  }

  return (
    <div className="code-view">
      <pre>
        <code>
          {text.split("\n").map((line, i) => (
            <span className="line" key={i}>
              {line}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

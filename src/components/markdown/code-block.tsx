import { useEffect, useState } from "react";
import { canHighlight, highlightToHtml } from "@/lib/highlight";
import { CopyButton } from "@/components/ui/copy-button";

/** A fenced code block inside Markdown, highlighted after load, with a copy button. */
export function CodeBlock({ code, grammar }: { code: string; grammar?: string }) {
  const text = code.replace(/\n$/, "");
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!canHighlight(grammar)) return;
    let alive = true;
    highlightToHtml(text, grammar)
      .then((result) => {
        if (alive) setHtml(result);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [text, grammar]);

  return (
    <div className="group relative">
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre>
          <code>{text}</code>
        </pre>
      )}
      <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <CopyButton value={text} label="Copy code" />
      </div>
    </div>
  );
}

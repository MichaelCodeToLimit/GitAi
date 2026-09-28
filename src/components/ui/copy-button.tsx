import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "Copy", className = "" }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); nothing useful to do.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`btn btn-sm !px-2 ${className}`}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied!" : label}
    >
      {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5 text-fg-muted" />}
    </button>
  );
}

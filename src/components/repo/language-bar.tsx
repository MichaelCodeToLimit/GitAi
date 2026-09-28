import { languageBar } from "@/lib/languages";

export function LanguageBar({ totals }: { totals: Record<string, number> }) {
  const langs = languageBar(totals);
  if (!langs.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">Languages</h2>
      <div className="flex h-2 overflow-hidden rounded-full bg-canvas-inset" role="img" aria-label="Language breakdown">
        {langs.map((l) => (
          <span key={l.name} style={{ width: `${l.percent}%`, background: l.color }} className="h-full border-r-2 border-canvas last:border-r-0" />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {langs.map((l) => (
          <li key={l.name} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: l.color }} />
            <span className="font-semibold">{l.name}</span>
            <span className="text-fg-muted">{l.percent.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

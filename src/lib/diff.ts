// Parses a unified diff ("@@ -a,b +c,d @@" hunks) into rows for display.

export type DiffRow =
  | { kind: "hunk"; text: string }
  | { kind: "context" | "add" | "del"; text: string; oldLine: number | null; newLine: number | null };

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/;

export function parsePatch(patch: string): DiffRow[] {
  const rows: DiffRow[] = [];
  let oldLine = 0;
  let newLine = 0;
  for (const line of patch.split("\n")) {
    const hunk = HUNK.exec(line);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      rows.push({ kind: "hunk", text: line });
      continue;
    }
    if (line.startsWith("\\")) continue; // "\ No newline at end of file"
    if (line.startsWith("+")) rows.push({ kind: "add", text: line.slice(1), oldLine: null, newLine: newLine++ });
    else if (line.startsWith("-")) rows.push({ kind: "del", text: line.slice(1), oldLine: oldLine++, newLine: null });
    else if (rows.length) rows.push({ kind: "context", text: line.slice(1), oldLine: oldLine++, newLine: newLine++ });
  }
  return rows;
}

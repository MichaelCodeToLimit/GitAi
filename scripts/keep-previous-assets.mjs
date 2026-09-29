// Copies the currently deployed build's asset files into dist/assets before a new deploy.
// A tab opened before the deploy still asks for the old file names; keeping them for one more
// version means those tabs keep working instead of failing to load a page.
//
// Usage: node scripts/keep-previous-assets.mjs https://<user>.github.io/<repo>/
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv[2] ?? "").replace(/\/*$/, "/");
if (!/^https?:\/\//.test(base)) {
  console.log("No site URL given; skipping.");
  process.exit(0);
}

const res = await fetch(`${base}asset-manifest.json`);
if (!res.ok) {
  console.log(`No previous asset manifest at ${base} (${res.status}); nothing to keep.`);
  process.exit(0);
}

const previous = (await res.json()).filter((name) => typeof name === "string" && /^[\w.-]+$/.test(name));
const missing = previous.filter((name) => !existsSync(join("dist/assets", name)));

let kept = 0;
const queue = [...missing];
async function worker() {
  for (let name = queue.shift(); name; name = queue.shift()) {
    const file = await fetch(`${base}assets/${name}`);
    if (!file.ok) continue;
    writeFileSync(join("dist/assets", name), Buffer.from(await file.arrayBuffer()));
    kept++;
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`Kept ${kept} of ${missing.length} files from the previous deploy.`);

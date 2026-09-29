// GitHub Pages has no rewrites: unknown paths are served 404.html. Making 404.html a copy of the
// app shell lets deep links like /GitAi/owner/repo/blob/main/README.md load the app, which then
// routes on the client. .nojekyll stops Pages from hiding files that start with an underscore.
// asset-manifest.json lists this build's files so the next deploy can keep them for open tabs
// (see keep-previous-assets.mjs).
import { copyFileSync, readdirSync, writeFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
writeFileSync("dist/.nojekyll", "");
const assets = readdirSync("dist/assets").filter((name) => !name.endsWith(".map"));
writeFileSync("dist/asset-manifest.json", JSON.stringify(assets));
console.log(`Wrote dist/404.html, dist/.nojekyll and a manifest of ${assets.length} assets`);

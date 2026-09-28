// GitHub Pages has no rewrites: unknown paths are served 404.html. Making 404.html a copy of the
// app shell lets deep links like /GitAi/owner/repo/blob/main/README.md load the app, which then
// routes on the client. .nojekyll stops Pages from hiding files that start with an underscore.
import { copyFileSync, writeFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
writeFileSync("dist/.nojekyll", "");
console.log("Wrote dist/404.html and dist/.nojekyll for GitHub Pages");

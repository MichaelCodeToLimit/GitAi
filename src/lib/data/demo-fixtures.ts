// Sample people, repositories and history for demo mode. Not used when the backend is connected.

import type { Profile } from "@/lib/types";

const DAY = 24 * 3600 * 1000;
const now = Date.now();
export const ago = (days: number, hours = 0) => new Date(now - days * DAY - hours * 3600 * 1000).toISOString();

export const DEMO_PROFILES: Profile[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    username: "nova",
    display_name: "Nova Reyes",
    bio: "Building small tools with big ideas. TypeScript, Rust and a lot of coffee.",
    avatar_url: null,
    website: "https://nova.example.dev",
    location: "Lisbon, Portugal",
    company: "Orbit Labs",
    created_at: ago(420),
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    username: "orbit-labs",
    display_name: "Orbit Labs",
    bio: "A tiny studio making developer tools and programming languages.",
    avatar_url: null,
    website: "https://orbit.example.dev",
    location: null,
    company: null,
    created_at: ago(900),
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    username: "sam",
    display_name: "Sam Okafor",
    bio: "Shell enthusiast. I automate everything twice.",
    avatar_url: null,
    website: null,
    location: "Lagos",
    company: null,
    created_at: ago(200),
  },
];

export type DemoCommit = {
  sha: string;
  message: string;
  author: string;
  days: number;
  hours?: number;
  files: { path: string; status: "added" | "modified" | "deleted"; additions: number; deletions: number; patch?: string }[];
};

export type DemoRepo = {
  id: string;
  owner: string;
  name: string;
  description: string | null;
  website_url: string | null;
  topics: string[];
  visibility: "public" | "private";
  created: number;
  branches: string[];
  tags: string[];
  files: Record<string, string>;
  /** Newest first. Each file's "last commit" is the newest commit listing it. */
  commits: DemoCommit[];
};

const hex = (seed: string) => {
  let h = 0x811c9dc5;
  let out = "";
  for (let round = 0; out.length < 40; round++) {
    for (const ch of seed + round) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
    out += h.toString(16).padStart(8, "0");
  }
  return out.slice(0, 40);
};

const STARLIGHT_README = `<p align="center">
  <img src="docs/logo.svg" alt="Starlight" width="96" height="96">
</p>

# Starlight

A tiny, fast static site generator with **zero config**. Point it at a folder of Markdown and get a
clean, accessible website in milliseconds.

> [!NOTE]
> Starlight is young. The API may change before \`1.0\`.

## Features

- Markdown with GitHub-flavored extras: tables, task lists, footnotes
- Syntax highlighting for 200+ languages
- Live reload while you write
- Output is plain HTML and CSS, with no client-side JavaScript required

## Install

\`\`\`bash
npm install -g starlight-ssg
\`\`\`

## Usage

\`\`\`ts
import { build } from "starlight-ssg";

await build({
  input: "content",
  output: "dist",
  siteName: "My notes",
});
\`\`\`

| Option     | Default     | Description                    |
| ---------- | ----------- | ------------------------------ |
| \`input\`    | \`content\`   | Folder with your Markdown files |
| \`output\`   | \`dist\`      | Where the site is written       |
| \`siteName\` | folder name | Shown in the header and title   |

## Roadmap

- [x] Markdown pages
- [x] Syntax highlighting
- [ ] RSS feed
- [ ] Image optimization

Read the [guide](docs/guide.md) for themes and deployment.
`;

const STARLIGHT_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="22" fill="url(#g)"/>
  <path d="M48 18l7.6 20.4L76 46l-20.4 7.6L48 74l-7.6-20.4L20 46l20.4-7.6z" fill="#fff"/>
</svg>
`;

const STARLIGHT_INDEX = `export { build } from "./build";
export type { BuildOptions } from "./build";
export { renderMarkdown } from "./markdown";
`;

const STARLIGHT_BUILD = `import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { renderMarkdown } from "./markdown";

export interface BuildOptions {
  input?: string;
  output?: string;
  siteName?: string;
}

/** Converts every Markdown file under \`input\` into an HTML page under \`output\`. */
export async function build({ input = "content", output = "dist", siteName }: BuildOptions = {}) {
  const started = performance.now();
  const files = await collect(input);
  await mkdir(output, { recursive: true });

  for (const file of files) {
    const markdown = await readFile(file, "utf8");
    const { html, title } = renderMarkdown(markdown);
    const target = join(output, relative(input, file).replace(/\\.md$/, ".html"));
    await writeFile(target, layout({ title, siteName: siteName ?? input, body: html }));
  }

  const ms = Math.round(performance.now() - started);
  console.log(\`Built \${files.length} pages in \${ms}ms\`);
}

async function collect(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? collect(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return nested.flat().filter((f) => f.endsWith(".md"));
}

function layout({ title, siteName, body }: { title: string; siteName: string; body: string }) {
  return \`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>\${title} · \${siteName}</title></head>
  <body><main>\${body}</main></body>
</html>\`;
}
`;

const STARLIGHT_MARKDOWN = `const HEADING = /^(#{1,6})\\s+(.*)$/;

export function renderMarkdown(source: string) {
  let title = "Untitled";
  const html = source
    .split("\\n")
    .map((line) => {
      const heading = HEADING.exec(line);
      if (heading) {
        const level = heading[1].length;
        if (level === 1) title = heading[2];
        return \`<h\${level}>\${escape(heading[2])}</h\${level}>\`;
      }
      return line.trim() ? \`<p>\${escape(line)}</p>\` : "";
    })
    .join("\\n");
  return { html, title };
}

function escape(text: string) {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
`;

const STARLIGHT_CLI = `#!/usr/bin/env node
import { build } from "./build";

const [input = "content", output = "dist"] = process.argv.slice(2);

build({ input, output }).catch((error) => {
  console.error(error);
  process.exit(1);
});
`;

const STARLIGHT_PACKAGE = `{
  "name": "starlight-ssg",
  "version": "0.3.0",
  "description": "A tiny, fast static site generator with zero config.",
  "type": "module",
  "bin": { "starlight": "dist/cli.js" },
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "node --test"
  },
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
`;

const STARLIGHT_GUIDE = `# Guide

## Themes

Starlight ships with a light and a dark theme. Pick one with \`--theme dark\`.

## Deploying

The \`dist\` folder is plain HTML, so any static host works: GitHub Pages, Cloudflare Pages,
Netlify or an S3 bucket.
`;

const MIT = `MIT License

Copyright (c) 2026 Nova Reyes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction.
`;

export const DEMO_REPOS: DemoRepo[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    owner: "nova",
    name: "starlight",
    description: "A tiny, fast static site generator with zero config.",
    website_url: "https://starlight.example.dev",
    topics: ["static-site-generator", "markdown", "typescript", "cli"],
    visibility: "public",
    created: 160,
    branches: ["main", "feat/live-reload", "docs/refresh"],
    tags: ["v0.3.0", "v0.2.1"],
    files: {
      "README.md": STARLIGHT_README,
      "LICENSE": MIT,
      "package.json": STARLIGHT_PACKAGE,
      "tsconfig.json": `{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "NodeNext",\n    "outDir": "dist",\n    "strict": true\n  },\n  "include": ["src"]\n}\n`,
      ".gitignore": "node_modules\ndist\n.DS_Store\n",
      "src/index.ts": STARLIGHT_INDEX,
      "src/build.ts": STARLIGHT_BUILD,
      "src/markdown.ts": STARLIGHT_MARKDOWN,
      "src/cli.ts": STARLIGHT_CLI,
      "docs/guide.md": STARLIGHT_GUIDE,
      "docs/logo.svg": STARLIGHT_LOGO,
    },
    commits: [
      {
        sha: hex("starlight-8"),
        message: "Print build time after each run\n\nMakes it easy to spot slow pages while writing.",
        author: "nova",
        days: 2,
        hours: 3,
        files: [
          {
            path: "src/build.ts",
            status: "modified",
            additions: 3,
            deletions: 0,
            patch: `@@ -10,6 +10,7 @@ export interface BuildOptions {

 /** Converts every Markdown file under \`input\` into an HTML page under \`output\`. */
 export async function build({ input = "content", output = "dist", siteName }: BuildOptions = {}) {
+  const started = performance.now();
   const files = await collect(input);
   await mkdir(output, { recursive: true });

@@ -20,6 +21,8 @@ export async function build({ input = "content", output = "dist", siteName }: Bu
     await writeFile(target, layout({ title, siteName: siteName ?? input, body: html }));
   }
+
+  const ms = Math.round(performance.now() - started);
+  console.log(\`Built \${files.length} pages in \${ms}ms\`);
 }

 async function collect(dir: string): Promise<string[]> {`,
          },
        ],
      },
      {
        sha: hex("starlight-7"),
        message: "Add roadmap and options table to README",
        author: "nova",
        days: 5,
        files: [
          {
            path: "README.md",
            status: "modified",
            additions: 14,
            deletions: 1,
            patch: `@@ -37,4 +37,17 @@ await build({
 });
 \`\`\`

-See the guide for more.
+| Option     | Default     | Description                    |
+| ---------- | ----------- | ------------------------------ |
+| \`input\`    | \`content\`   | Folder with your Markdown files |
+| \`output\`   | \`dist\`      | Where the site is written       |
+| \`siteName\` | folder name | Shown in the header and title   |
+
+## Roadmap
+
+- [x] Markdown pages
+- [x] Syntax highlighting
+- [ ] RSS feed
+- [ ] Image optimization
+
+Read the [guide](docs/guide.md) for themes and deployment.`,
          },
        ],
      },
      {
        sha: hex("starlight-6"),
        message: "Add a logo",
        author: "nova",
        days: 9,
        files: [{ path: "docs/logo.svg", status: "added", additions: 10, deletions: 0 }],
      },
      {
        sha: hex("starlight-5"),
        message: "Escape double quotes in rendered text",
        author: "sam",
        days: 16,
        files: [
          {
            path: "src/markdown.ts",
            status: "modified",
            additions: 1,
            deletions: 1,
            patch: `@@ -18,5 +18,5 @@ export function renderMarkdown(source: string) {
 }

 function escape(text: string) {
-  return text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
+  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
 }`,
          },
        ],
      },
      {
        sha: hex("starlight-4"),
        message: "Write the deployment guide",
        author: "nova",
        days: 30,
        files: [{ path: "docs/guide.md", status: "added", additions: 10, deletions: 0 }],
      },
      {
        sha: hex("starlight-3"),
        message: "Add CLI entry point",
        author: "nova",
        days: 48,
        files: [
          { path: "src/cli.ts", status: "added", additions: 9, deletions: 0 },
          { path: "package.json", status: "modified", additions: 1, deletions: 0 },
        ],
      },
      {
        sha: hex("starlight-2"),
        message: "Render headings and paragraphs",
        author: "nova",
        days: 90,
        files: [
          { path: "src/markdown.ts", status: "added", additions: 22, deletions: 0 },
          { path: "src/index.ts", status: "added", additions: 3, deletions: 0 },
          { path: "src/build.ts", status: "added", additions: 38, deletions: 0 },
        ],
      },
      {
        sha: hex("starlight-1"),
        message: "Initial commit",
        author: "nova",
        days: 160,
        files: [
          { path: "README.md", status: "added", additions: 40, deletions: 0 },
          { path: "LICENSE", status: "added", additions: 6, deletions: 0 },
          { path: "package.json", status: "added", additions: 15, deletions: 0 },
          { path: "tsconfig.json", status: "added", additions: 9, deletions: 0 },
          { path: ".gitignore", status: "added", additions: 3, deletions: 0 },
        ],
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    owner: "orbit-labs",
    name: "tiny-lang",
    description: "An experimental programming language with a friendly compiler.",
    website_url: null,
    topics: ["programming-language", "compiler", "rust"],
    visibility: "public",
    created: 300,
    branches: ["main"],
    tags: ["v0.1.0"],
    files: {
      "README.md": `# tiny-lang\n\nA small, expression-oriented language with **helpful error messages**.\n\n\`\`\`\nlet greet = fn(name) { "Hello, " + name + "!" }\nprint(greet("world"))\n\`\`\`\n\n## Build\n\n\`\`\`bash\ncargo run -- examples/hello.tiny\n\`\`\`\n`,
      "Cargo.toml": `[package]\nname = "tiny-lang"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\n`,
      "src/main.rs": `mod lexer;\n\nuse std::{env, fs};\n\nfn main() {\n    let path = env::args().nth(1).expect("usage: tiny <file>");\n    let source = fs::read_to_string(&path).expect("could not read file");\n    for token in lexer::tokenize(&source) {\n        println!("{token:?}");\n    }\n}\n`,
      "src/lexer.rs": `#[derive(Debug, PartialEq)]\npub enum Token {\n    Ident(String),\n    Number(f64),\n    Str(String),\n    Symbol(char),\n}\n\npub fn tokenize(source: &str) -> Vec<Token> {\n    let mut tokens = Vec::new();\n    let mut chars = source.chars().peekable();\n    while let Some(&c) = chars.peek() {\n        if c.is_whitespace() {\n            chars.next();\n        } else if c.is_ascii_digit() {\n            let mut n = String::new();\n            while let Some(&d) = chars.peek() {\n                if !d.is_ascii_digit() && d != '.' { break; }\n                n.push(d);\n                chars.next();\n            }\n            tokens.push(Token::Number(n.parse().unwrap()));\n        } else {\n            tokens.push(Token::Symbol(c));\n            chars.next();\n        }\n    }\n    tokens\n}\n`,
      "examples/hello.tiny": `let greet = fn(name) { "Hello, " + name + "!" }\nprint(greet("world"))\n`,
    },
    commits: [
      {
        sha: hex("tiny-3"),
        message: "Lex numbers with decimals",
        author: "orbit-labs",
        days: 12,
        files: [{ path: "src/lexer.rs", status: "modified", additions: 8, deletions: 2 }],
      },
      {
        sha: hex("tiny-2"),
        message: "Add hello world example",
        author: "nova",
        days: 40,
        files: [
          { path: "examples/hello.tiny", status: "added", additions: 2, deletions: 0 },
          { path: "README.md", status: "modified", additions: 6, deletions: 0 },
        ],
      },
      {
        sha: hex("tiny-1"),
        message: "Initial commit",
        author: "orbit-labs",
        days: 300,
        files: [
          { path: "README.md", status: "added", additions: 8, deletions: 0 },
          { path: "Cargo.toml", status: "added", additions: 6, deletions: 0 },
          { path: "src/main.rs", status: "added", additions: 11, deletions: 0 },
        ],
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    owner: "nova",
    name: "pixel-garden",
    description: "A cozy browser game about growing pixel plants.",
    website_url: "https://pixel-garden.example.dev",
    topics: ["game", "canvas", "javascript"],
    visibility: "public",
    created: 70,
    branches: ["main"],
    tags: [],
    files: {
      "README.md": `# Pixel Garden\n\nPlant seeds, water them and watch pixel flowers bloom. Runs in any modern browser.\n\nOpen \`index.html\` to play.\n`,
      "index.html": `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <title>Pixel Garden</title>\n    <link rel="stylesheet" href="style.css" />\n  </head>\n  <body>\n    <canvas id="garden" width="320" height="180"></canvas>\n    <script src="game.js"></script>\n  </body>\n</html>\n`,
      "style.css": `body {\n  margin: 0;\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n  background: #1b1f23;\n}\n\ncanvas {\n  image-rendering: pixelated;\n  width: 960px;\n}\n`,
      "game.js": `const canvas = document.getElementById("garden");\nconst ctx = canvas.getContext("2d");\nconst plants = [];\n\ncanvas.addEventListener("click", (event) => {\n  const rect = canvas.getBoundingClientRect();\n  const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);\n  plants.push({ x, height: 1 });\n});\n\nfunction tick() {\n  ctx.fillStyle = "#87ceeb";\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\n  for (const plant of plants) {\n    plant.height = Math.min(plant.height + 0.05, 40);\n    ctx.fillStyle = "#3fa34d";\n    ctx.fillRect(plant.x, canvas.height - plant.height, 2, plant.height);\n  }\n  requestAnimationFrame(tick);\n}\n\ntick();\n`,
    },
    commits: [
      {
        sha: hex("pixel-2"),
        message: "Let plants grow over time",
        author: "nova",
        days: 20,
        files: [{ path: "game.js", status: "modified", additions: 4, deletions: 1 }],
      },
      {
        sha: hex("pixel-1"),
        message: "First playable version",
        author: "nova",
        days: 70,
        files: [
          { path: "README.md", status: "added", additions: 5, deletions: 0 },
          { path: "index.html", status: "added", additions: 12, deletions: 0 },
          { path: "style.css", status: "added", additions: 12, deletions: 0 },
        ],
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    owner: "nova",
    name: "notes",
    description: "Personal notes and scratchpad.",
    website_url: null,
    topics: [],
    visibility: "private",
    created: 30,
    branches: ["main"],
    tags: [],
    files: {
      "README.md": "# Notes\n\nOnly I can see this repository.\n",
      "ideas.md": "- A CLI that turns TODO comments into issues\n- Dark mode for the garden game\n",
    },
    commits: [
      {
        sha: hex("notes-1"),
        message: "Start a notes repo",
        author: "nova",
        days: 30,
        files: [
          { path: "README.md", status: "added", additions: 3, deletions: 0 },
          { path: "ideas.md", status: "added", additions: 2, deletions: 0 },
        ],
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    owner: "sam",
    name: "dotfiles",
    description: "My shell, editor and terminal setup.",
    website_url: null,
    topics: ["dotfiles", "zsh", "shell"],
    visibility: "public",
    created: 180,
    branches: ["main"],
    tags: [],
    files: {
      "README.md": "# dotfiles\n\n```bash\n./install.sh\n```\n",
      "install.sh": `#!/usr/bin/env bash\nset -euo pipefail\n\nfor file in .zshrc .gitconfig; do\n  ln -sf "$PWD/$file" "$HOME/$file"\n  echo "linked $file"\ndone\n`,
      ".zshrc": `export EDITOR=nvim\nalias gs="git status"\nalias gl="git log --oneline --graph"\n`,
      ".gitconfig": `[user]\n  name = Sam Okafor\n[init]\n  defaultBranch = main\n`,
    },
    commits: [
      {
        sha: hex("dot-1"),
        message: "Add install script",
        author: "sam",
        days: 6,
        files: [{ path: "install.sh", status: "added", additions: 7, deletions: 0 }],
      },
      {
        sha: hex("dot-0"),
        message: "Initial dotfiles",
        author: "sam",
        days: 180,
        files: [
          { path: "README.md", status: "added", additions: 5, deletions: 0 },
          { path: ".zshrc", status: "added", additions: 3, deletions: 0 },
          { path: ".gitconfig", status: "added", additions: 4, deletions: 0 },
        ],
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    owner: "sam",
    name: "weekend-project",
    description: "Nothing here yet.",
    website_url: null,
    topics: [],
    visibility: "public",
    created: 1,
    branches: [],
    tags: [],
    files: {},
    commits: [],
  },
];

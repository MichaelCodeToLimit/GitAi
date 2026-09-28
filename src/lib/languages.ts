// File extension -> language: display name, color for the language bar, and highlighter grammar.

export type Language = { name: string; color: string; grammar?: string; bar?: boolean };

const L = (name: string, color: string, grammar?: string, bar = true): Language => ({ name, color, grammar, bar });

export const LANGUAGES: Record<string, Language> = {
  typescript: L("TypeScript", "#3178c6", "typescript"),
  tsx: L("TypeScript", "#3178c6", "tsx"),
  javascript: L("JavaScript", "#f1e05a", "javascript"),
  jsx: L("JavaScript", "#f1e05a", "jsx"),
  python: L("Python", "#3572A5", "python"),
  ruby: L("Ruby", "#701516", "ruby"),
  go: L("Go", "#00ADD8", "go"),
  rust: L("Rust", "#dea584", "rust"),
  java: L("Java", "#b07219", "java"),
  kotlin: L("Kotlin", "#A97BFF", "kotlin"),
  swift: L("Swift", "#F05138", "swift"),
  c: L("C", "#555555", "c"),
  cpp: L("C++", "#f34b7d", "cpp"),
  csharp: L("C#", "#178600", "csharp"),
  objc: L("Objective-C", "#438eff", "objective-c"),
  php: L("PHP", "#4F5D95", "php"),
  html: L("HTML", "#e34c26", "html"),
  css: L("CSS", "#663399", "css"),
  scss: L("SCSS", "#c6538c", "scss"),
  less: L("Less", "#1d365d", "less"),
  vue: L("Vue", "#41b883", "vue"),
  svelte: L("Svelte", "#ff3e00", "svelte"),
  astro: L("Astro", "#ff5a03", "astro"),
  shell: L("Shell", "#89e051", "shellscript"),
  powershell: L("PowerShell", "#012456", "powershell"),
  batch: L("Batchfile", "#C1F12E", "bat"),
  lua: L("Lua", "#000080", "lua"),
  dart: L("Dart", "#00B4AB", "dart"),
  r: L("R", "#198CE7", "r"),
  scala: L("Scala", "#c22d40", "scala"),
  haskell: L("Haskell", "#5e5086", "haskell"),
  elixir: L("Elixir", "#6e4a7e", "elixir"),
  erlang: L("Erlang", "#B83998", "erlang"),
  clojure: L("Clojure", "#db5855", "clojure"),
  zig: L("Zig", "#ec915c", "zig"),
  nim: L("Nim", "#ffc200", "nim"),
  julia: L("Julia", "#a270ba", "julia"),
  solidity: L("Solidity", "#AA6746", "solidity"),
  gdscript: L("GDScript", "#355570", "gdscript"),
  glsl: L("GLSL", "#5686a5", "glsl"),
  wgsl: L("WGSL", "#1a5e9a", "wgsl"),
  hlsl: L("HLSL", "#aace60", "hlsl"),
  ocaml: L("OCaml", "#ef7a08", "ocaml"),
  fsharp: L("F#", "#b845fc", "fsharp"),
  groovy: L("Groovy", "#4298b8", "groovy"),
  perl: L("Perl", "#0298c3", "perl"),
  elm: L("Elm", "#60B5CC", "elm"),
  nix: L("Nix", "#7e7eff", "nix"),
  crystal: L("Crystal", "#000100", "crystal"),
  gleam: L("Gleam", "#ffaff3", "gleam"),
  mojo: L("Mojo", "#ff4c1f", "mojo"),
  v: L("V", "#4f87c4", "v"),
  d: L("D", "#ba595e", "d"),
  asm: L("Assembly", "#6E4C13", "asm"),
  sql: L("SQL", "#e38c00", "sql", false),
  graphql: L("GraphQL", "#e10098", "graphql", false),
  dockerfile: L("Dockerfile", "#384d54", "docker"),
  makefile: L("Makefile", "#427819", "make"),
  cmake: L("CMake", "#DA3434", "cmake"),
  hcl: L("HCL", "#844FBA", "hcl"),
  prisma: L("Prisma", "#0c344b", "prisma", false),
  proto: L("Protocol Buffers", "#4a90e2", "proto", false),
  latex: L("TeX", "#3D6117", "latex"),
  matlab: L("MATLAB", "#e16737", "matlab"),
  // Data, config and prose: highlighted but not counted in the language bar.
  json: L("JSON", "#292929", "json", false),
  jsonc: L("JSON", "#292929", "jsonc", false),
  markdown: L("Markdown", "#083fa1", "markdown", false),
  mdx: L("MDX", "#fcb32c", "mdx", false),
  yaml: L("YAML", "#cb171e", "yaml", false),
  toml: L("TOML", "#9c4221", "toml", false),
  ini: L("INI", "#d1dbe0", "ini", false),
  xml: L("XML", "#0060ac", "xml", false),
  svg: L("SVG", "#ff9900", "xml", false),
  csv: L("CSV", "#237346", "csv", false),
  diff: L("Diff", "#8b949e", "diff", false),
  dotenv: L("Dotenv", "#e5d559", "dotenv", false),
  text: L("Text", "#8b949e", undefined, false),
};

const EXTENSIONS: Record<string, string> = {
  ts: "typescript", mts: "typescript", cts: "typescript", tsx: "tsx",
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "jsx",
  py: "python", pyw: "python", pyi: "python", rb: "ruby", go: "go", rs: "rust",
  java: "java", kt: "kotlin", kts: "kotlin", swift: "swift",
  c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hh: "cpp", hxx: "cpp",
  cs: "csharp", m: "objc", mm: "objc", php: "php",
  html: "html", htm: "html", css: "css", scss: "scss", less: "less",
  vue: "vue", svelte: "svelte", astro: "astro",
  sh: "shell", bash: "shell", zsh: "shell", fish: "shell", ps1: "powershell", psm1: "powershell",
  bat: "batch", cmd: "batch", lua: "lua", dart: "dart", r: "r", scala: "scala",
  hs: "haskell", ex: "elixir", exs: "elixir", erl: "erlang", clj: "clojure", cljs: "clojure",
  zig: "zig", nim: "nim", jl: "julia", sol: "solidity", gd: "gdscript",
  glsl: "glsl", vert: "glsl", frag: "glsl", wgsl: "wgsl", hlsl: "hlsl",
  ml: "ocaml", fs: "fsharp", fsx: "fsharp", groovy: "groovy", gradle: "groovy",
  pl: "perl", pm: "perl", elm: "elm", nix: "nix", cr: "crystal", gleam: "gleam",
  mojo: "mojo", v: "v", d: "d", asm: "asm", s: "asm",
  sql: "sql", graphql: "graphql", gql: "graphql", hcl: "hcl", tf: "hcl",
  prisma: "prisma", proto: "proto", tex: "latex",
  json: "json", jsonc: "jsonc", json5: "jsonc", md: "markdown", markdown: "markdown", mdx: "mdx",
  yaml: "yaml", yml: "yaml", toml: "toml", ini: "ini", cfg: "ini", conf: "ini",
  xml: "xml", plist: "xml", svg: "svg", csv: "csv", diff: "diff", patch: "diff",
  txt: "text", log: "text",
};

const FILENAMES: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "makefile",
  gnumakefile: "makefile",
  "cmakelists.txt": "cmake",
  gemfile: "ruby",
  rakefile: "ruby",
  ".env": "dotenv",
  ".env.example": "dotenv",
  ".bashrc": "shell",
  ".zshrc": "shell",
};

/** Language key for a file path, or "text" when unknown. */
export function languageForPath(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase();
  if (FILENAMES[name]) return FILENAMES[name];
  if (name.startsWith(".env.")) return "dotenv";
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return "text";
  return EXTENSIONS[name.slice(dot + 1)] ?? "text";
}

/** Language key for a markdown code fence info string such as "ts" or "python". */
export function languageForFence(info: string): string {
  const key = info.toLowerCase();
  if (LANGUAGES[key]) return key;
  if (EXTENSIONS[key]) return EXTENSIONS[key];
  const aliases: Record<string, string> = {
    sh: "shell", shellscript: "shell", console: "shell", zsh: "shell", ps: "powershell",
    "c++": "cpp", "c#": "csharp", cs: "csharp", yml: "yaml", py: "python", rb: "ruby", rs: "rust",
    js: "javascript", ts: "typescript", md: "markdown", docker: "dockerfile", make: "makefile",
    objectivec: "objc", "objective-c": "objc", golang: "go", kt: "kotlin", html5: "html",
  };
  return aliases[key] ?? "text";
}

/** Color for a language name, falling back to a stable hue for languages we don't list. */
export function languageColor(name: string) {
  const known = Object.values(LANGUAGES).find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (known) return known.color;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 55% 50%)`;
}

/** Bytes per language name (from the Git server) -> language bar entries, largest first. */
export function languageBar(totals: Record<string, number>) {
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  if (!sum) return [];
  const list = Object.entries(totals)
    .map(([name, bytes]) => ({ name, color: languageColor(name), percent: (bytes / sum) * 100 }))
    .sort((a, b) => b.percent - a.percent);
  // Fold the long tail into "Other" like GitHub does.
  const head = list.filter((l) => l.percent >= 0.5).slice(0, 7);
  const rest = 100 - head.reduce((a, l) => a + l.percent, 0);
  return rest >= 0.1 ? [...head, { name: "Other", color: "#8b949e", percent: rest }] : head;
}

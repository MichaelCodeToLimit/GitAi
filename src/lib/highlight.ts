// Syntax highlighting in the browser with Shiki's JavaScript regex engine.
// Grammars load on demand, so a page only downloads the languages it shows.

import type { HighlighterCore } from "shiki/core";

type GrammarModule = Promise<{ default: unknown }>;

const GRAMMARS: Record<string, () => GrammarModule> = {
  typescript: () => import("@shikijs/langs/typescript"),
  tsx: () => import("@shikijs/langs/tsx"),
  javascript: () => import("@shikijs/langs/javascript"),
  jsx: () => import("@shikijs/langs/jsx"),
  python: () => import("@shikijs/langs/python"),
  ruby: () => import("@shikijs/langs/ruby"),
  go: () => import("@shikijs/langs/go"),
  rust: () => import("@shikijs/langs/rust"),
  java: () => import("@shikijs/langs/java"),
  kotlin: () => import("@shikijs/langs/kotlin"),
  swift: () => import("@shikijs/langs/swift"),
  c: () => import("@shikijs/langs/c"),
  cpp: () => import("@shikijs/langs/cpp"),
  csharp: () => import("@shikijs/langs/csharp"),
  "objective-c": () => import("@shikijs/langs/objective-c"),
  php: () => import("@shikijs/langs/php"),
  html: () => import("@shikijs/langs/html"),
  css: () => import("@shikijs/langs/css"),
  scss: () => import("@shikijs/langs/scss"),
  less: () => import("@shikijs/langs/less"),
  vue: () => import("@shikijs/langs/vue"),
  svelte: () => import("@shikijs/langs/svelte"),
  astro: () => import("@shikijs/langs/astro"),
  shellscript: () => import("@shikijs/langs/shellscript"),
  powershell: () => import("@shikijs/langs/powershell"),
  bat: () => import("@shikijs/langs/bat"),
  lua: () => import("@shikijs/langs/lua"),
  dart: () => import("@shikijs/langs/dart"),
  r: () => import("@shikijs/langs/r"),
  scala: () => import("@shikijs/langs/scala"),
  haskell: () => import("@shikijs/langs/haskell"),
  elixir: () => import("@shikijs/langs/elixir"),
  erlang: () => import("@shikijs/langs/erlang"),
  clojure: () => import("@shikijs/langs/clojure"),
  zig: () => import("@shikijs/langs/zig"),
  nim: () => import("@shikijs/langs/nim"),
  julia: () => import("@shikijs/langs/julia"),
  solidity: () => import("@shikijs/langs/solidity"),
  gdscript: () => import("@shikijs/langs/gdscript"),
  glsl: () => import("@shikijs/langs/glsl"),
  wgsl: () => import("@shikijs/langs/wgsl"),
  hlsl: () => import("@shikijs/langs/hlsl"),
  ocaml: () => import("@shikijs/langs/ocaml"),
  fsharp: () => import("@shikijs/langs/fsharp"),
  groovy: () => import("@shikijs/langs/groovy"),
  perl: () => import("@shikijs/langs/perl"),
  elm: () => import("@shikijs/langs/elm"),
  nix: () => import("@shikijs/langs/nix"),
  crystal: () => import("@shikijs/langs/crystal"),
  gleam: () => import("@shikijs/langs/gleam"),
  mojo: () => import("@shikijs/langs/mojo"),
  v: () => import("@shikijs/langs/v"),
  d: () => import("@shikijs/langs/d"),
  asm: () => import("@shikijs/langs/asm"),
  sql: () => import("@shikijs/langs/sql"),
  graphql: () => import("@shikijs/langs/graphql"),
  docker: () => import("@shikijs/langs/docker"),
  make: () => import("@shikijs/langs/make"),
  cmake: () => import("@shikijs/langs/cmake"),
  hcl: () => import("@shikijs/langs/hcl"),
  prisma: () => import("@shikijs/langs/prisma"),
  proto: () => import("@shikijs/langs/proto"),
  latex: () => import("@shikijs/langs/latex"),
  matlab: () => import("@shikijs/langs/matlab"),
  json: () => import("@shikijs/langs/json"),
  jsonc: () => import("@shikijs/langs/jsonc"),
  markdown: () => import("@shikijs/langs/markdown"),
  mdx: () => import("@shikijs/langs/mdx"),
  yaml: () => import("@shikijs/langs/yaml"),
  toml: () => import("@shikijs/langs/toml"),
  ini: () => import("@shikijs/langs/ini"),
  xml: () => import("@shikijs/langs/xml"),
  csv: () => import("@shikijs/langs/csv"),
  diff: () => import("@shikijs/langs/diff"),
  dotenv: () => import("@shikijs/langs/dotenv"),
};

let highlighter: Promise<HighlighterCore> | null = null;

function getHighlighter() {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
      import("shiki/core"),
      import("shiki/engine/javascript"),
    ]);
    return createHighlighterCore({
      themes: [import("@shikijs/themes/github-light"), import("@shikijs/themes/github-dark")],
      langs: [],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  })();
  return highlighter;
}

export function canHighlight(grammar: string | undefined): grammar is string {
  return Boolean(grammar && GRAMMARS[grammar]);
}

/** Highlighted HTML (a <pre class="shiki">), or null if the grammar is unknown. */
export async function highlightToHtml(code: string, grammar: string): Promise<string | null> {
  const load = GRAMMARS[grammar];
  if (!load) return null;
  const hl = await getHighlighter();
  if (!hl.getLoadedLanguages().includes(grammar)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await hl.loadLanguage((await load()).default as any);
  }
  return hl.codeToHtml(code, {
    lang: grammar,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}

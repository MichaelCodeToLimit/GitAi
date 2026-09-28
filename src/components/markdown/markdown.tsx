import Markdown, { defaultUrlTransform, type Components } from "react-markdown";
import { Link } from "react-router";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { ReactElement, ReactNode } from "react";
import { RepoImage } from "@/components/repo/repo-image";
import { rawFileUrl } from "@/lib/data/git";
import { isDemo } from "@/lib/data/mode";
import { languageForFence, LANGUAGES } from "@/lib/languages";
import { blobUrl, resolveRepoPath } from "@/lib/paths";
import { CodeBlock } from "./code-block";
import { remarkAlerts } from "./remark-alerts";

/** Where relative links in the document point: a directory inside a repository at a ref. */
export type MarkdownBase = { owner: string; repo: string; ref: string; dir: string; isPrivate: boolean };

const ALERT_CLASSES = ["note", "tip", "important", "warning", "caution"].map((k) => `markdown-alert-${k}`);

const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "picture", "source"],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "align"],
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height", "align", "loading"],
    source: ["srcSet", "media", "type", "width", "height"],
    blockquote: [["className", "markdown-alert", ...ALERT_CLASSES]],
    p: [["className", "markdown-alert-title"]],
  },
};

const isExternal = (url: string) => /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//");

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  }
  return "";
}

/** A repository path for a relative URL in the document, or null if it isn't one. */
function repoPath(base: MarkdownBase | null, url: string | undefined) {
  if (!url || !base || isExternal(url) || url.startsWith("#")) return null;
  const [pathPart, hash] = url.split("#", 2);
  let decoded = pathPart.split("?")[0];
  try {
    decoded = decodeURI(decoded);
  } catch {
    // Keep it as written.
  }
  const path = resolveRepoPath(base.dir, decoded);
  return path === null ? null : { path, hash };
}

function components(base: MarkdownBase | null): Components {
  return {
    a: ({ href, children, node: _node, ...rest }) => {
      const target = repoPath(base, href);
      if (target && base) {
        const to = blobUrl(base.owner, base.repo, base.ref, target.path) + (target.hash ? `#${target.hash}` : "");
        return (
          <Link to={to} {...rest}>
            {children}
          </Link>
        );
      }
      const external = href ? isExternal(href) : false;
      return (
        <a href={href} rel={external ? "nofollow noopener noreferrer" : undefined} {...rest}>
          {children}
        </a>
      );
    },
    img: ({ src, alt, node: _node, ...rest }) => {
      const target = typeof src === "string" ? repoPath(base, src) : null;
      if (target && base) {
        const url = rawFileUrl(base.owner, base.repo, base.ref, target.path);
        return <RepoImage src={url} auth={base.isPrivate && !isDemo} alt={alt ?? ""} loading="lazy" {...rest} />;
      }
      return <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" {...rest} />;
    },
    source: ({ srcSet, node: _node, ...rest }) => {
      const target = typeof srcSet === "string" ? repoPath(base, srcSet) : null;
      const url = target && base ? rawFileUrl(base.owner, base.repo, base.ref, target.path) : srcSet;
      return <source srcSet={typeof url === "string" ? url : undefined} {...rest} />;
    },
    pre: ({ children }) => {
      const child = (Array.isArray(children) ? children[0] : children) as ReactElement<{ className?: string; children?: ReactNode }>;
      const lang = /language-([\w+#-]+)/.exec(child?.props?.className ?? "")?.[1];
      const key = lang ? languageForFence(lang) : "text";
      return <CodeBlock code={textOf(child?.props?.children)} grammar={LANGUAGES[key]?.grammar} />;
    },
  };
}

/** Renders user Markdown (READMEs, .md files) safely, GitHub-style. */
export function MarkdownView({ source, base }: { source: string; base: MarkdownBase | null }) {
  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[remarkGfm, remarkAlerts]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeSlug]}
        urlTransform={defaultUrlTransform}
        components={components(base)}
      >
        {source}
      </Markdown>
    </div>
  );
}

// URL builders and repository path helpers.

export function repoUrl(owner: string, repo: string, ...rest: string[]) {
  const suffix = rest.filter(Boolean).join("/");
  return `/${owner}/${repo}${suffix ? `/${suffix}` : ""}`;
}

/** Encodes each path segment, keeping the slashes. */
export function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** "<ref>/<path>" with each segment encoded. Refs may contain slashes, like GitHub URLs. */
function refAndPath(ref: string, path: string) {
  return path ? `${encodePath(ref)}/${encodePath(path)}` : encodePath(ref);
}

export function treeUrl(owner: string, repo: string, ref: string, path = "") {
  return repoUrl(owner, repo, "tree", refAndPath(ref, path));
}

export function blobUrl(owner: string, repo: string, ref: string, path: string) {
  return repoUrl(owner, repo, "blob", refAndPath(ref, path));
}

export function commitsUrl(owner: string, repo: string, ref: string, path = "") {
  const base = repoUrl(owner, repo, "commits", encodePath(ref));
  return path ? `${base}?path=${encodeURIComponent(path)}` : base;
}

export function commitUrl(owner: string, repo: string, sha: string) {
  return repoUrl(owner, repo, "commit", sha);
}

/**
 * Splits catch-all segments into a ref and a path by matching the longest known branch or tag,
 * or a commit SHA. Mirrors how GitHub resolves /tree/feature/x/src.
 */
export function splitRefAndPath(segments: string[], refNames: string[]): { ref: string; path: string } | null {
  const parts = segments;
  const known = new Set(refNames);
  for (let i = parts.length; i >= 1; i--) {
    const candidate = parts.slice(0, i).join("/");
    if (known.has(candidate)) return { ref: candidate, path: parts.slice(i).join("/") };
  }
  if (parts[0] && /^[0-9a-f]{7,40}$/i.test(parts[0])) return { ref: parts[0], path: parts.slice(1).join("/") };
  return null;
}

export function dirname(path: string) {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}

export function basename(path: string) {
  return path.slice(path.lastIndexOf("/") + 1);
}

export function extension(path: string) {
  const name = basename(path);
  const i = name.lastIndexOf(".");
  return i <= 0 ? "" : name.slice(i + 1).toLowerCase();
}

/** Resolves a relative link (as written in a README) against a directory inside the repo. */
export function resolveRepoPath(fromDir: string, target: string): string | null {
  const parts = target.startsWith("/") ? [] : fromDir.split("/").filter(Boolean);
  for (const seg of target.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else parts.push(seg);
  }
  return parts.join("/");
}

/** Mirrors private.valid_path() in the database. */
export function isValidRepoPath(path: string) {
  return (
    path.length > 0 &&
    path.length <= 1024 &&
    !path.startsWith("/") &&
    !path.endsWith("/") &&
    !path.includes("//") &&
    !/(^|\/)\.\.?(\/|$)/.test(path) &&
    !/(^|\/)\.git(\/|$)/i.test(path) &&
    // eslint-disable-next-line no-control-regex
    !/[\u0000-\u001f\\]/.test(path)
  );
}

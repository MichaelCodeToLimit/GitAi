import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { fetchWithAuth } from "@/lib/data/git";

/**
 * An image from a repository. Private repositories need the user's token, which <img> can't send,
 * so the file is fetched and shown through an object URL.
 */
export function RepoImage({ src, auth, alt = "", ...rest }: ImgHTMLAttributes<HTMLImageElement> & { src: string; auth: boolean }) {
  const [objectUrl, setObjectUrl] = useState<{ src: string; url: string } | null>(null);

  useEffect(() => {
    if (!auth) return;
    let alive = true;
    let created: string | null = null;
    fetchWithAuth(src)
      .then((blob) => {
        if (!alive) return;
        created = URL.createObjectURL(blob);
        setObjectUrl({ src, url: created });
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [src, auth]);

  const url = auth ? (objectUrl?.src === src ? objectUrl.url : null) : src;
  if (!url) return <span className="inline-block rounded bg-canvas-inset align-middle" style={{ width: rest.width ?? 16, height: rest.height ?? 16 }} />;
  return <img src={url} alt={alt} {...rest} />;
}

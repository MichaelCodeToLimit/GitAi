import { extension } from "@/lib/paths";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico", "svg"]);

export function isImagePath(path: string) {
  return IMAGE_EXTENSIONS.has(extension(path));
}

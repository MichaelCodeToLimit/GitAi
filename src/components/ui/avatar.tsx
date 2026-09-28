const PALETTE = ["#6639ba", "#1f6feb", "#1a7f37", "#bf3989", "#bc4c00", "#0e8a8a", "#8250df", "#cf222e"];

function hueFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** A profile picture, or a colored initial when there isn't one. */
export function Avatar({
  src,
  name,
  size = 20,
  square = false,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  square?: boolean;
  className?: string;
}) {
  const radius = square ? "rounded-md" : "rounded-full";
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`${radius} shrink-0 bg-canvas-inset object-cover ring-1 ring-line-muted ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${radius} inline-flex shrink-0 items-center justify-center font-semibold text-white uppercase select-none ${className}`}
      style={{ width: size, height: size, background: hueFor(name), fontSize: Math.max(9, size * 0.45) }}
    >
      {name.charAt(0)}
    </span>
  );
}

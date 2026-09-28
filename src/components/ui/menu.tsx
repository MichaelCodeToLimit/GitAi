import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** A small dropdown: a trigger button and a popover panel that closes on outside click or Escape. */
export function Menu({
  trigger,
  children,
  align = "right",
  label,
  triggerClassName = "btn",
  panelClassName = "w-56",
}: {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  label: string;
  triggerClassName?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className={triggerClassName}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          className={`absolute z-40 mt-1.5 overflow-hidden rounded-lg border border-line bg-overlay py-1 shadow-pop ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-fg hover:bg-accent hover:text-accent-fg";

export function MenuDivider() {
  return <div className="my-1 border-t border-line-muted" role="separator" />;
}

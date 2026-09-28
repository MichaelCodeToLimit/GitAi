import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}

const OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

/** Three-way theme switch used in the footer and settings. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the theme is only known after hydration
  useEffect(() => setMounted(true), []);

  return (
    <div className="inline-flex rounded-md border border-line p-0.5" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = mounted && theme === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(id)}
            className={`rounded px-2 py-1 ${active ? "bg-canvas-inset text-fg" : "text-fg-muted hover:text-fg"}`}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

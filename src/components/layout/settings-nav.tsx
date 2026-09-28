import { NavLink } from "react-router";
import { KeyRound, Lock, User } from "lucide-react";

const ITEMS = [
  { to: "/settings/profile", label: "Public profile", icon: User },
  { to: "/settings/tokens", label: "Access tokens", icon: KeyRound },
  { to: "/auth/update-password", label: "Password", icon: Lock },
];

export function SettingsLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1012px] gap-8 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6">
      <nav aria-label="Settings" className="flex gap-1 overflow-x-auto md:flex-col">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm whitespace-nowrap ${
                isActive ? "bg-canvas-inset font-semibold text-fg shadow-[inset_2px_0_0_var(--accent)]" : "text-fg-muted hover:bg-canvas-subtle hover:text-fg"
              }`
            }
          >
            <Icon className="size-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0">
        <h1 className="border-b border-line-muted pb-2 text-2xl font-semibold">{title}</h1>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}

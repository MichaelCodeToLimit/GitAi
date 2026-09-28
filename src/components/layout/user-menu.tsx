import { Link, useNavigate, useRevalidator } from "react-router";
import { BookMarked, KeyRound, LogOut, Plus, Settings, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuDivider, menuItemClass } from "@/components/ui/menu";
import { signOut } from "@/lib/auth";

export function NewMenu() {
  return (
    <Menu
      label="Create new"
      triggerClassName="btn btn-sm !px-2"
      trigger={
        <>
          <Plus className="size-4" />
          <span className="sr-only">Create new</span>
        </>
      }
      panelClassName="w-52"
    >
      {(close) => (
        <Link to="/new" className={menuItemClass} role="menuitem" onClick={close}>
          <BookMarked className="size-4" /> New repository
        </Link>
      )}
    </Menu>
  );
}

export function UserMenu({ username, displayName, avatarUrl }: { username: string; displayName: string | null; avatarUrl: string | null }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  async function onSignOut() {
    await signOut();
    await navigate("/");
    await revalidator.revalidate();
  }

  return (
    <Menu label="Open account menu" triggerClassName="rounded-full" trigger={<Avatar src={avatarUrl} name={username} size={30} />} panelClassName="w-60">
      {(close) => (
        <>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <Avatar src={avatarUrl} name={username} size={32} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{username}</div>
              {displayName && <div className="truncate text-xs text-fg-muted">{displayName}</div>}
            </div>
          </div>
          <MenuDivider />
          <Link to={`/${username}`} className={menuItemClass} role="menuitem" onClick={close}>
            <User className="size-4" /> Your profile
          </Link>
          <Link to={`/${username}?tab=repositories`} className={menuItemClass} role="menuitem" onClick={close}>
            <BookMarked className="size-4" /> Your repositories
          </Link>
          <MenuDivider />
          <Link to="/settings/profile" className={menuItemClass} role="menuitem" onClick={close}>
            <Settings className="size-4" /> Settings
          </Link>
          <Link to="/settings/tokens" className={menuItemClass} role="menuitem" onClick={close}>
            <KeyRound className="size-4" /> Access tokens
          </Link>
          <MenuDivider />
          <button
            type="button"
            className={menuItemClass}
            role="menuitem"
            onClick={() => {
              close();
              void onSignOut();
            }}
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </>
      )}
    </Menu>
  );
}

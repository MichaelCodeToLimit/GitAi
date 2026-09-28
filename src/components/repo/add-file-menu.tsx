import { Link } from "react-router";
import { ChevronDown, FilePlus2, Plus, Upload } from "lucide-react";
import { Menu, menuItemClass } from "@/components/ui/menu";

export function AddFileMenu({ newHref, uploadHref }: { newHref: string; uploadHref: string }) {
  return (
    <Menu
      label="Add file"
      triggerClassName="btn"
      panelClassName="w-48"
      trigger={
        <>
          <Plus className="size-4 sm:hidden" />
          <span className="hidden sm:inline">Add file</span>
          <ChevronDown className="size-4 text-fg-muted" />
        </>
      }
    >
      {(close) => (
        <>
          <Link to={newHref} className={menuItemClass} role="menuitem" onClick={close}>
            <FilePlus2 className="size-4" /> Create new file
          </Link>
          <Link to={uploadHref} className={menuItemClass} role="menuitem" onClick={close}>
            <Upload className="size-4" /> Upload files
          </Link>
        </>
      )}
    </Menu>
  );
}

import { Link } from "react-router";
import { LogoMark } from "@/components/logo";
import { ThemeSwitch } from "@/components/theme";
import { SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line-muted">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-8 text-xs text-fg-muted sm:flex-row sm:items-center md:px-6">
        <div className="flex items-center gap-2">
          <LogoMark size={20} />
          <span>
            © {new Date().getFullYear()} {SITE_NAME}
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/explore" className="hover:text-link">
            Explore
          </Link>
          <Link to="/new" className="hover:text-link">
            New repository
          </Link>
          <Link to="/settings/tokens" className="hover:text-link">
            Access tokens
          </Link>
        </nav>
        <div className="sm:ml-auto">
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router";
import { SITE_NAME } from "@/lib/site";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <g stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M11 9v14" />
        <path d="M21 12.5c0 5.5-10 4-10 9.5" />
      </g>
      <circle cx="11" cy="8.5" r="2.7" fill="white" />
      <circle cx="11" cy="23.5" r="2.7" fill="white" />
      <circle cx="21" cy="11" r="2.7" fill="white" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-fg" aria-label={`${SITE_NAME} home`}>
      <LogoMark />
      <span className="text-[17px] whitespace-nowrap">{SITE_NAME}</span>
    </Link>
  );
}

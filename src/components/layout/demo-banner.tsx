import { FlaskConical } from "lucide-react";
import { isDemo } from "@/lib/data/mode";

export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="border-b border-warn/30 bg-warn-soft text-fg">
      <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-1.5 text-xs md:px-6">
        <FlaskConical className="size-3.5 shrink-0 text-warn" />
        <span>
          <strong className="font-semibold">Demo mode.</strong> You&apos;re looking at sample data. Connect Supabase and
          the Git server to sign in and save changes.
        </span>
      </div>
    </div>
  );
}

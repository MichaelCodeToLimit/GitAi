import { LogoMark } from "@/components/logo";

export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <LogoMark size={44} />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      <div className="card space-y-4 bg-canvas-subtle p-5">{children}</div>
      {footer && <div className="card mt-4 p-4 text-center text-sm">{footer}</div>}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-fg-muted">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export function SubmitButton({
  children,
  pending = false,
  pendingLabel,
  className = "btn btn-primary",
  disabled,
}: {
  children: ReactNode;
  pending?: boolean;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button type="submit" className={className} disabled={pending || disabled}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold">
        {label}
        {optional && <span className="ml-1 font-normal text-fg-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormMessage({ state }: { state: { ok: boolean; error?: string; message?: string } | null | undefined }) {
  if (!state) return null;
  if (!state.ok && state.error) {
    return (
      <div role="alert" className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-fg">
        {state.error}
      </div>
    );
  }
  if (state.ok && state.message) {
    return (
      <div role="status" className="rounded-md border border-ok/40 bg-ok-soft px-3 py-2 text-sm text-fg">
        {state.message}
      </div>
    );
  }
  return null;
}

/** Field errors from a failed action result, or an empty object. */
export function errorsOf(state: { ok: boolean; fieldErrors?: Record<string, string> } | null | undefined) {
  return state && !state.ok ? (state.fieldErrors ?? {}) : {};
}

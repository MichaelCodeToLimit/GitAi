import { useState, type FormEvent } from "react";
import type { ActionResult } from "@/lib/types";

/** Runs an async handler for a form, tracking pending state and the last result. */
export function useSubmitState<T = undefined>(handler: (form: FormData) => Promise<ActionResult<T>>) {
  const [result, setResult] = useState<ActionResult<T> | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      setResult(await handler(new FormData(e.currentTarget)));
    } catch (error) {
      setResult({ ok: false, error: (error as Error).message || "Something went wrong." });
    } finally {
      setPending(false);
    }
  }

  return { result, pending, onSubmit, setResult };
}

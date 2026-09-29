import { useEffect, useState } from "react";
import { OrDivider } from "@/components/auth/auth-card";
import { getEnabledProviders, signInWithProvider, type OAuthProvider } from "@/lib/auth";

// Provider marks for the sign-in buttons.
const ICONS: Record<OAuthProvider, React.ReactNode> = {
  github: (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  ),
  azure: (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
      <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.6-1-2.6-4.1ZM13.9 5a4.5 4.5 0 0 0 1.1-3.3 4.7 4.7 0 0 0-3.1 1.6 4.4 4.4 0 0 0-1.1 3.2c1.2.1 2.4-.6 3.1-1.5Z" />
    </svg>
  ),
};

const LABELS: Record<OAuthProvider, string> = { github: "GitHub", google: "Google", azure: "Microsoft", apple: "Apple" };

export function OAuthButtons({ next, verb }: { next: string; verb: "Sign in" | "Sign up" }) {
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  useEffect(() => {
    let alive = true;
    void getEnabledProviders().then((list) => alive && setProviders(list));
    return () => {
      alive = false;
    };
  }, []);

  async function go(provider: OAuthProvider) {
    setBusy(provider);
    setError(null);
    const result = await signInWithProvider(provider, next);
    // On success the browser is already leaving for the provider.
    if (!result.ok) {
      setError(result.error);
      setBusy(null);
    }
  }

  if (!providers.length) return null;

  return (
    <div className="space-y-4">
      <div className={`grid gap-2 ${providers.length > 1 ? "grid-cols-2" : ""}`}>
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            className="btn w-full"
            disabled={busy !== null}
            onClick={() => go(provider)}
            aria-label={`${verb} with ${LABELS[provider]}`}
          >
            {ICONS[provider]}
            {LABELS[provider]}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <OrDivider />
    </div>
  );
}

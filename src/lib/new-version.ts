// Every deploy replaces the site's code files with newly named ones. A tab that was open before
// the deploy still asks for the old names, which no longer exist. Reloading picks up the new build.

const RELOADED_AT = "gitai-reloaded-for-new-version";

export function isStaleBuildError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload/i.test(
    message,
  );
}

/** Reloads the page once. Returns false if it already did so moments ago, to avoid a reload loop. */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOADED_AT) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    // No storage: still reload once; a loop is impossible because the new build loads fine.
  }
  window.location.reload();
  return true;
}

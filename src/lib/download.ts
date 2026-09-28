import { fetchWithAuth } from "@/lib/data/git";

/** Downloads a Git server file with the user's token and saves it under a file name. */
export async function downloadFile(url: string, filename: string) {
  const blob = await fetchWithAuth(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

/** Opens a Git server file in a new tab, fetching it with the user's token first. */
export async function openFile(url: string) {
  const tab = window.open("", "_blank");
  const blob = await fetchWithAuth(url);
  const objectUrl = URL.createObjectURL(blob);
  if (tab) tab.location.href = objectUrl;
  else window.location.href = objectUrl;
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

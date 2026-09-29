import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { ThemeProvider } from "@/components/theme";
import { isDemo } from "@/lib/data/mode";
import { resetViewer } from "@/lib/data/session";
import { supabase } from "@/lib/supabase";
import { routes } from "./routes";

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/+$/, "") || "/" });

// Re-run loaders when the signed-in user changes, in this or another tab.
if (!isDemo) {
  let currentUserId: string | null | undefined;
  supabase().auth.onAuthStateChange((event, session) => {
    const userId = session?.user.id ?? null;
    const changed = currentUserId !== undefined && userId !== currentUserId;
    currentUserId = userId;
    if (!changed && event !== "USER_UPDATED") return; // e.g. token refreshes, or SIGNED_IN on tab focus

    resetViewer();
    // The auth callback pages redirect by themselves when sign-in finishes. Re-running their
    // loaders would try to use the one-time sign-in code a second time.
    if (!/\/auth\/(callback|confirm)$/.test(router.state.location.pathname)) void router.revalidate();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);

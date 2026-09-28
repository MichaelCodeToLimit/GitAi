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

// Re-run loaders when someone signs in or out in this or another tab.
if (!isDemo) {
  supabase().auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      resetViewer();
      void router.revalidate();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);

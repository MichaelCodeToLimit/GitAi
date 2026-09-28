import type { RouteObject } from "react-router";
import * as Root from "@/pages/root";

// Pages load on demand so the first visit only downloads what it shows.
const page = (load: () => Promise<Record<string, unknown>>) => async () => {
  const mod = await load();
  return {
    Component: mod.default as React.ComponentType,
    loader: mod.loader as RouteObject["loader"],
    action: mod.action as RouteObject["action"],
  };
};

export const routes: RouteObject[] = [
  {
    id: "root",
    path: "/",
    Component: Root.default,
    loader: Root.loader,
    ErrorBoundary: Root.ErrorBoundary,
    HydrateFallback: Root.HydrateFallback,
    children: [
      {
        ErrorBoundary: Root.ErrorBoundary,
        children: [
          { index: true, lazy: page(() => import("@/pages/home")) },
          { path: "explore", lazy: page(() => import("@/pages/explore")) },
          { path: "login", lazy: page(() => import("@/pages/auth/login")) },
          { path: "signup", lazy: page(() => import("@/pages/auth/signup")) },
          { path: "forgot-password", lazy: page(() => import("@/pages/auth/forgot-password")) },
          { path: "auth/callback", lazy: page(() => import("@/pages/auth/callback")) },
          { path: "auth/confirm", lazy: page(() => import("@/pages/auth/confirm")) },
          { path: "auth/update-password", lazy: page(() => import("@/pages/auth/update-password")) },
          { path: "auth/error", lazy: page(() => import("@/pages/auth/error")) },
          { path: "new", lazy: page(() => import("@/pages/new-repo")) },
          { path: "settings/profile", lazy: page(() => import("@/pages/settings/profile")) },
          { path: "settings/tokens", lazy: page(() => import("@/pages/settings/tokens")) },
          { path: ":owner", lazy: page(() => import("@/pages/profile")) },
          {
            id: "repo",
            path: ":owner/:repo",
            lazy: page(() => import("@/pages/repo/layout")),
            children: [
              {
                ErrorBoundary: Root.ErrorBoundary,
                children: [
                  { index: true, lazy: page(() => import("@/pages/repo/home")) },
                  { path: "tree/*", lazy: page(() => import("@/pages/repo/tree")) },
                  { path: "blob/*", lazy: page(() => import("@/pages/repo/blob")) },
                  { path: "commits", lazy: page(() => import("@/pages/repo/commits")) },
                  { path: "commits/*", lazy: page(() => import("@/pages/repo/commits")) },
                  { path: "commit/:sha", lazy: page(() => import("@/pages/repo/commit")) },
                  { path: "branches", lazy: page(() => import("@/pages/repo/branches")) },
                  { path: "settings", lazy: page(() => import("@/pages/repo/settings")) },
                  { path: "new/*", lazy: page(() => import("@/pages/repo/new-file")) },
                  { path: "edit/*", lazy: page(() => import("@/pages/repo/edit-file")) },
                  { path: "upload/*", lazy: page(() => import("@/pages/repo/upload")) },
                ],
              },
            ],
          },
          { path: "*", Component: Root.NotFound },
        ],
      },
    ],
  },
];

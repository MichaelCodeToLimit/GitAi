# Notes for coding agents

- The website is a Vite + React Router 8 single-page app (data mode: route `loader`/`action`),
  deployed to GitHub Pages. There is no web server: never add server-only code, secrets or
  Node APIs to `src/`.
- React Router 8 docs ship in `node_modules/react-router/docs/`. Read them before using an
  unfamiliar API; import `RouterProvider` from `react-router/dom`, everything else from `react-router`.
- All backend access goes through `src/lib/data/`. Pages never call Supabase or the Git server
  directly, and every function there has a demo-mode branch backed by `demo-fixtures.ts`.
- Internal links must use React Router's `Link`/`Form`/`redirect` so the `/GitAi/` base path
  is applied. Plain `<a href="/...">` breaks on GitHub Pages.
- Folder ownership: `supabase/` and `git-server/` belong to the backend work. Coordinate before
  changing tables, RPCs or Git server endpoints the website uses.

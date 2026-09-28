# Git AI

A GitHub-style home for code, backed by real Git. People push and clone with the normal `git`
command, then browse files, READMEs, history and diffs on the web, and make quick edits in the
browser.

This repository holds three parts:

| Part | Folder | Runs on |
| --- | --- | --- |
| Website (this README) | `src/`, `index.html` | GitHub Pages, as a static single-page app |
| Database, sign-in, storage | `supabase/` | Supabase |
| Git server (push, clone, browse API) | `git-server/` | Render |

## Website

Vite + React 19 + React Router 8 + Tailwind CSS 4. Everything runs in the browser: pages read people
and repository records from Supabase and code from the Git server's API, sending the signed-in
user's Supabase token so private repositories stay private.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/, with 404.html for GitHub Pages deep links
npm run lint
```

### Configuration

Copy `.env.example` to `.env.local`. All values are public (they ship in the browser bundle).

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase project (Settings → API Keys) |
| `VITE_GIT_SERVER_URL` | Base URL of the Git server, used for clone URLs and code browsing |
| `VITE_BASE_PATH` | Path the site is served from: `/GitAi/` on GitHub Pages, `/` with a custom domain |

**Demo mode:** with no Supabase settings, the site runs on built-in sample data, so it can be
reviewed before the backend is live. The sign-in page offers "Try the demo" to act as a sample user.

### Deploying

`.github/workflows/deploy-pages.yml` builds and publishes the site on every push to `main`.
One-time setup in the GitHub repository:

1. **Settings → Pages → Source:** GitHub Actions.
2. **Settings → Secrets and variables → Actions → Variables:** add `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_GIT_SERVER_URL` when the backend is ready.
3. In Supabase **Auth → URL Configuration**, add the site URL
   (`https://michaelcodetolimit.github.io/GitAi/`) and allow redirects to `/GitAi/auth/callback`.

GitHub Pages has no server-side rewrites, so deep links are served by `404.html`, a copy of the
app shell. They work in browsers, but search engines see a 404 status for repository pages.

### Layout

```
src/
  main.tsx, routes.tsx     app entry and route table
  pages/                   one module per route: loader (data), action (forms), component
  components/              UI: layout, repo browser, markdown, code view, forms
  lib/data/                the only place that talks to Supabase or the Git server
                           (plus demo data used when the backend isn't configured)
```

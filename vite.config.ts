import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // GitHub Pages serves project sites from /<repo>/. Override with VITE_BASE_PATH (e.g. "/" for a custom domain).
  const base = env.VITE_BASE_PATH || (mode === "production" ? "/GitAi/" : "/");

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: { port: 5173 },
    build: {
      target: "es2022",
      sourcemap: true,
      // Big grammars (C++, PHP…) are split out and only load when a file needs them.
      chunkSizeWarningLimit: 1000,
    },
  };
});

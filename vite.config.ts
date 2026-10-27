import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { githubStars } from "./plugins/github-stars";
import { GITHUB_OWNER } from "./src/lib/github-stars";

export default defineConfig({
  plugins: [react(), tailwindcss(), githubStars(GITHUB_OWNER)],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
    },
  },
});

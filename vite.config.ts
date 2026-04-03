import { cpSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "copy-manifest-to-dist",
      closeBundle() {
        cpSync(path.resolve(rootDir, "manifest.json"), path.resolve(rootDir, "dist/manifest.json"));
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(rootDir, "src/popup/index.html"),
        settings: path.resolve(rootDir, "src/settings/index.html"),
        offscreen: path.resolve(rootDir, "src/offscreen/index.html"),
        background: path.resolve(rootDir, "src/background/index.ts"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});

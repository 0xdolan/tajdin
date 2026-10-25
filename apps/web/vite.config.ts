import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { docsPlugin } from './build/docs-plugin';
import pkg from './package.json' with { type: 'json' };

// Served from https://0xdolan.github.io/tajdin/ (GitHub Pages project site).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/tajdin/',
  plugins: [react(), tailwindcss(), docsPlugin()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});

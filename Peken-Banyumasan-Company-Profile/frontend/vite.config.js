import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    port: 5173,
    // Auto-open the browser for normal `npm run dev`, but NOT when Playwright
    // starts the dev server for E2E (it sets PW_TEST) — avoids a popped tab.
    open: !process.env.PW_TEST,
  },
  build: {
    outDir: 'dist',
    // Assets in public/ are copied as-is. Images referenced from JS/CSS
    // via absolute paths like "/assets/foo.jpg" resolve correctly in
    // both dev and build. No further asset handling needed.
  },
});

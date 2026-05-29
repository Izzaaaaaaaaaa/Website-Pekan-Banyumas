import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    // Assets in public/ are copied as-is. Images referenced from JS/CSS
    // via absolute paths like "/assets/foo.jpg" resolve correctly in
    // both dev and build. No further asset handling needed.
  },
});

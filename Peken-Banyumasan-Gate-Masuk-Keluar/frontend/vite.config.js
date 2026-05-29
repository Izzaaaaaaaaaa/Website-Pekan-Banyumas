import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server:  { port: 5174 },
  preview: { port: 5174 },
  optimizeDeps: {
    // Prevents Vite from pre-bundling lucide-react, which causes
    // "Could not resolve ./icons/glass-water.js" on Windows
    exclude: ['lucide-react'],
  },
})
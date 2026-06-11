import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Standalone Vitest config (NOT vite.config.js): React plugin only, excluding
// the Cloudflare plugin whose Workers runtime conflicts with jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**', 'src/services/**', 'src/components/**'],
    },
  },
})

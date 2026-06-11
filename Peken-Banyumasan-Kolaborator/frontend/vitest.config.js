import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Standalone Vitest config (NOT vite.config.js): uses only the React plugin,
// deliberately excluding the Cloudflare plugin which sets up a Workers runtime
// that conflicts with the jsdom test environment.
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
      include: ['src/lib/**', 'src/constants/**', 'src/components/**'],
    },
  },
})

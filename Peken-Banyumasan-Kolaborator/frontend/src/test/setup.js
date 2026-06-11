// Global test setup — runs before every test file (see vitest.config.js).
// Registers jest-dom matchers (toBeInTheDocument, etc.) on Vitest's expect,
// and unmounts React trees after each test to keep tests isolated.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

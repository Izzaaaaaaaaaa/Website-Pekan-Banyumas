// Global test setup — registers jest-dom matchers on Vitest's expect and
// unmounts React trees after each test for isolation.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

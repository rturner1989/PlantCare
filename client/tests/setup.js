// Vitest setup — runs once before every test file.
// Extends expect() with @testing-library/jest-dom matchers
// (toBeInTheDocument, toHaveAttribute, toHaveClass, etc.).

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount any components rendered by the previous test so state doesn't leak.
afterEach(() => {
  cleanup()
})

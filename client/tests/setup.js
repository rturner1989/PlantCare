// Vitest setup — runs once before every test file.
// Extends expect() with @testing-library/jest-dom matchers
// (toBeInTheDocument, toHaveAttribute, toHaveClass, etc.).

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom doesn't implement matchMedia. Polyfill with a no-match stub so any
// breakpoint-sensing code (Dialog's mobile vs desktop variant, useReducedMotion)
// falls through to the desktop / no-match branch in unit tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Unmount any components rendered by the previous test so state doesn't leak.
afterEach(() => {
  cleanup()
})

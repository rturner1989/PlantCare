/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://api:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    // Component/unit tests live in tests/ mirroring the src/ layout
    // (e.g. src/components/ui/Action.jsx → tests/components/ui/Action.test.jsx).
    // Vitest picks up .test.js / .test.jsx; Playwright handles .spec.js.
    include: ['tests/**/*.test.{js,jsx}'],
    css: false,
  },
})

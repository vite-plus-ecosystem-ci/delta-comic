import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite-plus'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  pack: {
    deps: { resolveDepSubpath: true },
    entry: './lib/index.ts',
    dts: { generator: 'tsgo', tsconfig: './tsconfig.app.json' },
  },
  root,
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
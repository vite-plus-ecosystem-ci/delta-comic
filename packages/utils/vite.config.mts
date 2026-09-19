import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    deps: { resolveDepSubpath: true },
    entry: ['./lib/index.ts', './vite/index.ts'],
    sourcemap: true,
    dts: { generator: 'tsgo', tsconfig: './tsconfig.app.json' },
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: 'node',
    include: ['lib/**/*.test.ts', 'vite/**/*.test.ts'],
  },
})
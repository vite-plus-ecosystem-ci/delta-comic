import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite-plus'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  pack: {
    deps: { resolveDepSubpath: true },
    entry: ['./lib/index.ts', './vite/index.ts'],
    alias: { '@': './lib' },
    dts: { tsconfig: './tsconfig.app.json', generator: 'tsgo' },
    sourcemap: true,
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./lib', import.meta.url)) } },
  root,
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    environment: 'node',
    include: ['lib/**/*.test.ts', 'vite/**/*.test.ts'],
  },
})
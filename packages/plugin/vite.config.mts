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
    clearMocks: false,
    environment: 'node',
    include: ['lib/**/*.test.ts', 'vite/**/*.test.ts'],
  },
})
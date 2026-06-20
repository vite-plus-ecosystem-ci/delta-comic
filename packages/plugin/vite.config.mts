import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite-plus'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  pack: {
    entry: ['./lib/index.ts', './vite/index.ts'],
    alias: { '@': './lib' },
    dts: { tsconfig: './tsconfig.app.json', tsgo: true },
    sourcemap: true,
  },
  root,
  test: { environment: 'node', include: ['lib/**/*.test.ts', 'vite/**/*.test.ts'] },
})
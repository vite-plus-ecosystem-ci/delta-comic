import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite-plus'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  pack: {
    deps: { resolveDepSubpath: true },
    dts: { generator: 'tsgo', tsconfig: './tsconfig.app.json' },
    sourcemap: true,
    entry: './lib/index.ts',
  },
  root,
  test: { clearMocks: false, environment: 'node', include: ['lib/**/*.test.ts'] },
})
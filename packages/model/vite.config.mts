import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite-plus'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  pack: { deps: { resolveDepSubpath: true }, entry: './lib/index.ts', dts: { generator: 'tsgo', tsconfig: './tsconfig.app.json' } },
  root,
  test: { environment: 'node', include: ['lib/**/*.test.ts'] },
})
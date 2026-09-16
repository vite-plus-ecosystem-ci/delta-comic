import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    deps: { resolveDepSubpath: true },
    entry: ['./lib/index.ts', './vite/index.ts'],
    sourcemap: true,
    dts: { generator: 'tsgo', tsconfig: './tsconfig.app.json' },
  },
  test: {
    clearMocks: false,
    environment: 'node',
    include: ['lib/**/*.test.ts', 'vite/**/*.test.ts'],
  },
})
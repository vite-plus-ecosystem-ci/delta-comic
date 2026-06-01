import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    dts: { tsgo: true, tsconfig: './tsconfig.app.json' },
    sourcemap: true,
    entry: './lib/index.ts',
  },
})
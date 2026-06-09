import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: './lib/index.ts',
    sourcemap: true,
    dts: { tsgo: true, tsconfig: './tsconfig.app.json' },
  },
})
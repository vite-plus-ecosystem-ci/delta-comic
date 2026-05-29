import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: { entry: './lib/index.ts', dts: { tsgo: true, tsconfig: './tsconfig.app.json' } },
})
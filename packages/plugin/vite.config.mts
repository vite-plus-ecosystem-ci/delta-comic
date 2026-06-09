import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['./lib/index.ts', './vite/index.ts'],
    alias: { '@': './lib' },
    dts: { tsconfig: './tsconfig.app.json', tsgo: true },
    sourcemap: true,
  },
})
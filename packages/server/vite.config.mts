import { fileURLToPath, URL } from 'node:url'

import { defineConfig, lazyPlugins } from 'vite-plus'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  pack: [
    {
      deps: { resolveDepSubpath: true },
      entry: './app/index.ts',
      dts: { generator: 'tsgo', tsconfig: './tsconfig.app.json' },
    },
    {
      deps: { resolveDepSubpath: true },
      entry: './lib/index.ts',
      dts: { generator: 'tsgo', tsconfig: './tsconfig.lib.json' },
    },
  ],
  plugins: lazyPlugins((async () => {
    if (process.env.VITEST || process.env.VP_COMMAND == 'test') return []
    const { cloudflare } = await import('@cloudflare/vite-plugin')
    return [cloudflare()]
  }) as any),
  resolve: {
    alias: { '@': fileURLToPath(new URL('./app', import.meta.url)) },
    extensions: ['.ts', '.tsx', '.json', '.mjs', '.js', '.jsx', '.mts'],
  },
  root,
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    alias: {
      'cloudflare:workers': fileURLToPath(new URL('./test/cloudflareWorkers.ts', import.meta.url)),
    },
    environment: 'node',
    include: ['app/**/*.test.ts', 'lib/**/*.test.ts'],
    root,
  },
})
import { defineConfig } from 'vite-plus'

import fmt from './oxfmt.config'
import lint from './oxlint.config'

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
    '*.{md,json,toml,rs,js,jsx,ts,tsx,mts,cts,mjs,cjs,vue,html}':
      'vp exec cspell --no-must-find-files',
  },
  fmt,
  lint,
  run: { cache: { tasks: true, scripts: true } },
  test: { exclude: ['**/node_modules/**', '**/.git/**', '.agents/**'] },
})
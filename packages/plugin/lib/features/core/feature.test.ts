import { describe, expect, it } from 'vite-plus/test'

import coreFeature, { coreConfig } from './feature'

describe('core built-in feature', () => {
  it('is enabled by default as a preboot plugin and exposes core settings', () => {
    expect(coreFeature).toMatchObject({
      enabledByDefault: true,
      meta: {
        kind: 'preboot',
        name: { id: 'core' },
        version: { plugin: '2.3.0', supportCore: '*' },
      },
    })

    const config = coreFeature.config({ platform: 'web', safe: true })
    expect(config).toEqual({ config: [coreConfig], name: 'core' })
  })
})
import { describe, expect, it } from 'vite-plus/test'
import { defineComponent } from 'vue'

import { EnvironmentRegistry } from './registry'

describe('environment registry', () => {
  it('keeps registrations typed by key and removes an owner as one unit', async () => {
    const registry = new EnvironmentRegistry()
    const first = defineComponent(() => () => null)
    const second = defineComponent(() => () => null)

    registry.register('reader-toolbar', first)
    await registry.withOwner('reader-plugin', async () => {
      registry.register('reader-toolbar', second)
    })

    expect(registry.forKey('reader-toolbar')).toHaveLength(2)
    registry.removeOwner('reader-plugin')
    expect(registry.forKey('reader-toolbar').map(entry => entry.component)).toEqual([first])
  })
})
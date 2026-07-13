import { describe, expect, it } from 'vite-plus/test'

import { isPluginManifestCompatible, parsePluginManifest, PluginManifestError } from './manifest'

const manifest = {
  author: 'delta-comic',
  description: 'A plugin bundled by the Delta Comic Vite plugin',
  entry: { cssPath: 'index.css', jsPath: 'index.mjs' },
  name: { display: 'Marketplace Test', id: 'marketplace-test' },
  require: [{ download: 'ap:layout', id: 'layout' }],
  version: { plugin: '1.2.3', supportCore: '^2.3.0' },
}

describe('Delta Comic plugin manifest', () => {
  it('parses the manifest.json format emitted by the Vite plugin', () => {
    expect(parsePluginManifest(JSON.parse(JSON.stringify(manifest)))).toEqual(manifest)
  })

  it('uses supportCore for the existing semver compatibility decision', () => {
    const parsed = parsePluginManifest(manifest)

    expect(isPluginManifestCompatible(parsed, '2.3.0')).toBe(true)
    expect(isPluginManifestCompatible(parsed, '3.0.0')).toBe(false)
  })

  it('rejects incomplete manifests and unsafe entry paths', () => {
    expect(() => parsePluginManifest({ version: { supportCore: '*' } })).toThrow(
      PluginManifestError,
    )
    expect(() => parsePluginManifest({ ...manifest, entry: { jsPath: '../outside.mjs' } })).toThrow(
      'safe relative path',
    )
  })
})
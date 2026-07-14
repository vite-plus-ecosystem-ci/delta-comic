import { describe, expect, it } from 'vite-plus/test'

import {
  exposeHostLibraries,
  extendsDepends,
  externalizeSharedRuntime,
  externalLibraryNames,
  hostExposedLibraryNames,
  umdDepends,
  umdLibraryNames,
} from '.'

const virtualModuleId = 'virtual:delta-comic/host-libraries'
const context = {
  error(message: string): never {
    throw new Error(message)
  },
  getModuleIds() {
    return [][Symbol.iterator]()
  },
}

describe('host external libraries', () => {
  it('generates one ABI from the UMD and host ESM registries', () => {
    expect(externalLibraryNames).toEqual({ ...umdLibraryNames, ...hostExposedLibraryNames })
    expect(Object.keys(extendsDepends)).toEqual(Object.keys(externalLibraryNames))

    Object.entries(externalLibraryNames).forEach(([moduleId, globalName]) => {
      expect(extendsDepends[moduleId as keyof typeof extendsDepends]).toBe(
        `window.$$lib$$.${globalName}`,
      )
    })
  })

  it('exposes only host-owned ESM modules from the bridge', () => {
    const plugin = exposeHostLibraries({ entry: '/repo/src/main.tsx' })
    const resolvedId = plugin.resolveId!(virtualModuleId)
    const hostModule = plugin.load!(resolvedId!)

    expect(hostModule).toContain('Object.assign(window.$$lib$$')
    Object.entries(hostExposedLibraryNames).forEach(([moduleId, globalName], index) => {
      expect(hostModule).toContain(`import * as library${index} from ${JSON.stringify(moduleId)}`)
      expect(hostModule).toContain(`${JSON.stringify(globalName)}: library${index}`)
    })
    Object.keys(umdLibraryNames).forEach(moduleId => {
      expect(hostModule).not.toContain(`from ${JSON.stringify(moduleId)}`)
    })
  })

  it('rewrites static and dynamic imports to the prebuilt UMD namespace', async () => {
    const plugin = exposeHostLibraries({ entry: '/repo/src/main.tsx' })
    const source = [
      `import { createApp as boot } from 'vue'`,
      `import * as Router from 'vue-router'`,
      `const experimental = import('vue-router/experimental')`,
    ].join('\n')
    const result = await plugin.transform.call(context, source, '/repo/src/main.tsx?direct')

    expect(result?.code).toContain(`import ${JSON.stringify(virtualModuleId)}`)
    expect(result?.code).toContain('const boot = window.$$lib$$.Vue.createApp')
    expect(result?.code).toContain('const Router = window.$$lib$$.VR')
    expect(result?.code).toContain('Promise.resolve(window.$$lib$$.VRExperimental)')
    expect(result?.code).not.toContain("from 'vue'")
  })

  it('does not externalize host ESM modules in the application', async () => {
    const plugin = exposeHostLibraries({ entry: '/repo/src/main.tsx' })
    const source = `const database = import('@delta-comic/db')`
    const result = await plugin.transform.call(context, source, '/repo/src/feature.ts')

    expect(result).toBeUndefined()
    expect(umdDepends).not.toHaveProperty('@delta-comic/db')
  })

  it('externalizes all ABI modules for third-party plugin bundles', async () => {
    const plugin = externalizeSharedRuntime()
    const source = [`import { ref } from 'vue'`, `const database = import('@delta-comic/db')`].join(
      '\n',
    )
    const result = await plugin.transform.call(context, source, '\0virtual:plugin-entry')

    expect(result?.code).toContain('const ref = window.$$lib$$.Vue.ref')
    expect(result?.code).toContain('Promise.resolve(window.$$lib$$.DcDb)')
  })

  it('supports default imports while preserving global-only package compatibility', async () => {
    const plugin = externalizeSharedRuntime()
    const result = await plugin.transform.call(
      context,
      `import Vue from 'vue'`,
      '/repo/src/plugin.ts',
    )

    expect(result?.code).toBe('const Vue = window.$$lib$$.Vue.default ?? window.$$lib$$.Vue\n')
  })

  it('fails the build if a shared framework package reaches the output graph', () => {
    const plugin = externalizeSharedRuntime()
    const duplicatedContext = {
      ...context,
      getModuleIds() {
        return ['/repo/node_modules/vue/dist/vue.runtime.esm-bundler.js'][Symbol.iterator]()
      },
    }

    expect(() => plugin.generateBundle.call(duplicatedContext)).toThrow(
      'bundled again instead of using the UMD instance',
    )
  })

  it('rejects star re-exports instead of silently dropping them', async () => {
    const plugin = externalizeSharedRuntime()

    await expect(
      plugin.transform.call(context, `export * from 'vue'`, '/repo/src/index.ts'),
    ).rejects.toThrow('cannot safely proxy')
  })

  it('normalizes Windows entry paths', async () => {
    const plugin = exposeHostLibraries({ entry: String.raw`C:\repo\src\main.tsx` })
    const result = await plugin.transform.call(context, '', 'C:/repo/src/main.tsx')

    expect(result?.code).toBe(`import ${JSON.stringify(virtualModuleId)}\n`)
  })
})
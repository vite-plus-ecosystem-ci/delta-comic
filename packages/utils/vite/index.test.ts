import { describe, expect, it } from 'vite-plus/test'

import { exposeHostLibraries, extendsDepends, externalLibraryNames } from '.'

const virtualModuleId = 'virtual:delta-comic/host-libraries'

describe('host external libraries', () => {
  it('generates the external ABI and host module from the same registry', () => {
    const plugin = exposeHostLibraries({ entry: '/repo/src/main.tsx' })
    const resolvedId = plugin.resolveId(virtualModuleId)
    const hostModule = plugin.load(resolvedId!)

    expect(Object.keys(extendsDepends)).toEqual(Object.keys(externalLibraryNames))
    expect(hostModule).toContain('Object.assign(window.$$lib$$')

    Object.entries(externalLibraryNames).forEach(([moduleId, globalName], index) => {
      expect(extendsDepends[moduleId as keyof typeof extendsDepends]).toBe(
        `window.$$lib$$.${globalName}`,
      )
      expect(hostModule).toContain(`import * as library${index} from ${JSON.stringify(moduleId)}`)
      expect(hostModule).toContain(`${JSON.stringify(globalName)}: library${index}`)
    })
  })

  it('injects the host module only into the configured entry', () => {
    const plugin = exposeHostLibraries({ entry: '/repo/src/main.tsx' })
    const source = 'export const app = true'

    expect(plugin.transform(source, '/repo/src/feature.ts')).toBeUndefined()
    expect(plugin.transform(source, '/repo/src/main.tsx?direct')).toEqual({
      code: `import ${JSON.stringify(virtualModuleId)}\n${source}`,
      map: null,
    })
  })

  it('normalizes Windows entry paths', () => {
    const plugin = exposeHostLibraries({ entry: String.raw`C:\repo\src\main.tsx` })

    expect(plugin.transform('', 'C:/repo/src/main.tsx')).toEqual({
      code: `import ${JSON.stringify(virtualModuleId)}\n`,
      map: null,
    })
  })
})
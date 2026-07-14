const HOST_LIBRARIES_MODULE_ID = 'virtual:delta-comic/host-libraries'
const RESOLVED_HOST_LIBRARIES_MODULE_ID = `\0${HOST_LIBRARIES_MODULE_ID}`

export const externalLibraryNames = {
  'vue': 'Vue',
  'naive-ui': 'Naive',
  'vue-router': 'VR',
  'pinia': 'Pinia',
  '@pinia/colada': 'Pc',
  '@delta-comic/ui': 'DcUi',
  '@delta-comic/model': 'DcModel',
  '@delta-comic/plugin': 'DcPlugin',
  '@delta-comic/utils': 'DcUtils',
  '@delta-comic/db': 'DcDb',
} as const

export type ExternalLibKey = typeof externalLibraryNames

export type ExternalLib = {
  [K in keyof ExternalLibKey]: `window.$$lib$$.${ExternalLibKey[K]}`
}

export const extendsDepends = Object.fromEntries(
  Object.entries(externalLibraryNames).map(([moduleId, globalName]) => [
    moduleId,
    `window.$$lib$$.${globalName}`,
  ]),
) as ExternalLib

export interface ExposeHostLibrariesOptions {
  entry: string
}

interface HostLibrariesPlugin {
  name: string
  enforce: 'pre'
  resolveId: (id: string) => string | undefined
  load: (id: string) => string | undefined
  transform: (code: string, id: string) => { code: string; map: null } | undefined
}

const normalizeModuleId = (id: string) => id.replaceAll('\\', '/').split('?')[0]

const createHostLibrariesModule = () => {
  const entries = Object.entries(externalLibraryNames)
  const imports = entries.map(
    ([moduleId], index) => `import * as library${index} from ${JSON.stringify(moduleId)}`,
  )
  const exposedLibraries = entries.map(
    ([, globalName], index) => `${JSON.stringify(globalName)}: library${index}`,
  )

  return `${imports.join('\n')}\n\nObject.assign(window.$$lib$$, {\n  ${exposedLibraries.join(',\n  ')},\n})\n`
}

/**
 * Registers the host application's canonical runtime libraries for external plugins.
 *
 * Plugin bundles continue to externalize these modules through `extendsDepends`, so
 * they always consume the same Vue, router, and state-management instances as the host.
 */
export const exposeHostLibraries = ({ entry }: ExposeHostLibrariesOptions): HostLibrariesPlugin => {
  const normalizedEntry = normalizeModuleId(entry)

  return {
    name: 'delta-comic:expose-host-libraries',
    enforce: 'pre',
    resolveId(id) {
      if (id == HOST_LIBRARIES_MODULE_ID) return RESOLVED_HOST_LIBRARIES_MODULE_ID
    },
    load(id) {
      if (id == RESOLVED_HOST_LIBRARIES_MODULE_ID) return createHostLibrariesModule()
    },
    transform(code, id) {
      if (normalizeModuleId(id) != normalizedEntry) return

      return { code: `import ${JSON.stringify(HOST_LIBRARIES_MODULE_ID)}\n${code}`, map: null }
    },
  }
}
import type { PluginArchiveDB } from '@delta-comic/db'
import { extendsDepends } from '@delta-comic/utils/vite'
import { merge } from 'es-toolkit'
import { viteExternalsPlugin as external } from 'vite-plugin-externals'
import monkey from 'vite-plugin-monkey'

type DeltaComicPluginContext = {
  emitFile(file: { type: 'asset'; fileName: string; source: string }): unknown
}

type DeltaComicPlugin = {
  name: string
  config?(config: unknown): unknown
  generateBundle?(this: DeltaComicPluginContext): void
}

type DeltaComicPluginOption = DeltaComicPlugin | DeltaComicPluginOption[] | false | null | undefined

export const deltaComic = (
  meta: PluginArchiveDB.Meta,
  command: 'build' | 'serve',
): DeltaComicPluginOption[] => {
  const externalGlobals = extendsDepends as Record<string, string>
  const isServer = command == 'serve'
  const plugin: DeltaComicPlugin = {
    name: 'delta-comic-helper',
    config(config: any) {
      return merge(config, {
        build: {
          lib: {
            entry: './src/main.ts',
            fileName: 'index',
            cssFileName: 'index',
            name: `$$lib$$.__DcPlugin__${meta.name.id.replace('-', '_')}__`,
            formats: ['es'],
          },
        },
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(meta, null, 2),
      })
    },
  }
  const externals = external(
    Object.fromEntries(
      Object.entries(externalGlobals).map(([key, val]) => [key, val.split('.').slice(1)]),
    ),
    { disableInServe: false },
  ) as DeltaComicPluginOption

  return [
    externals,
    ...(isServer
      ? [
          monkey({
            entry: meta.entry?.jsPath ?? 'src/main.ts',
            userscript: { description: JSON.stringify(meta) },
            build: { externalGlobals: isServer ? {} : externalGlobals },
            server: { mountGmApi: false, open: false, prefix: '[DEV] ' },
          }) as DeltaComicPluginOption,
        ]
      : [plugin]),
  ]
}
import { Global, type Search, usePluginStore } from '@delta-comic/plugin'
import { DcCell } from '@delta-comic/ui'
import { SharedFunction } from '@delta-comic/utils'

export type ThinkList = Awaited<ReturnType<Search.SearchMethod['getAutoComplete']>>

export const getBarcodeList = (searchText: string, signal: AbortSignal): Promise<ThinkList> => {
  const store = usePluginStore()
  const flattedAll = Array.from(Global.barcode.entries())
  const matched = flattedAll.map(v => [v[0], v[1].filter(b => b.match(searchText))] as const)
  return Promise.all(
    matched.flatMap(r =>
      r[1].map(i => (
        <DcCell
          title={`转至${i.name}`}
          onClick={() => {
            void i
              .getContent(searchText, signal)
              .then(content => SharedFunction.call('routeToContent', ...content))
          }}
          label={`来源:${store.$getI18nName(r[0])}`}
          value={searchText}
          class='dc-interactive w-full'
        />
      )),
    ),
  )
}
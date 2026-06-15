export interface ExternalLibKey {
  'vue': 'Vue'
  'vant': 'Vant'
  'naive-ui': 'Naive'
  'vue-router': 'VR'
  'pinia': 'Pinia'
  '@pinia/colada': 'Pc'
  '@delta-comic/ui': 'DcUi'
  '@delta-comic/model': 'DcModel'
  '@delta-comic/plugin': 'DcPlugin'
  '@delta-comic/utils': 'DcUtils'
  '@delta-comic/db': 'DcDb'
}

export type ExternalLib = {
  [K in keyof ExternalLibKey]: `window.$$lib$$.${ExternalLibKey[K]}`
}

export const extendsDepends: ExternalLib = {
  'vue': 'window.$$lib$$.Vue',
  'vant': 'window.$$lib$$.Vant',
  'naive-ui': 'window.$$lib$$.Naive',
  'pinia': 'window.$$lib$$.Pinia',
  'vue-router': 'window.$$lib$$.VR',
  '@pinia/colada': 'window.$$lib$$.Pc',
  '@delta-comic/ui': 'window.$$lib$$.DcUi',
  '@delta-comic/model': 'window.$$lib$$.DcModel',
  '@delta-comic/utils': 'window.$$lib$$.DcUtils',
  '@delta-comic/plugin': 'window.$$lib$$.DcPlugin',
  '@delta-comic/db': 'window.$$lib$$.DcDb',
}
import type { DeltaRouter } from '@delta-comic/utils'

import type { AppMessageSchema } from './i18n/locales'

declare module 'vue' {
  interface ComponentCustomProperties {
    $router: DeltaRouter
  }
}

declare module 'vue-router' {
  interface TypesConfig {
    Router: DeltaRouter
    $router: DeltaRouter
  }
}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends AppMessageSchema {}
}

export {}
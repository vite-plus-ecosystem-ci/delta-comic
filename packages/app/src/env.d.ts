import type { DeltaRouter } from '@delta-comic/utils'

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

export {}
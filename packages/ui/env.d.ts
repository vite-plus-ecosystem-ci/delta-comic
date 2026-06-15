/// <reference types="vite/client" />
/// <reference types="@delta-comic/utils" />

import type {} from 'vue-router'

declare module '*.css' {}

declare module '*.css?inline' {
  const content: string
  export default content
}

declare module 'tailwind-merge' {
  export type ClassNameValue = ClassNameArray | string | null | undefined | 0 | 0n | false
  export type ClassNameArray = readonly ClassNameValue[]
  export const twMerge: (...classLists: ClassNameValue[]) => string
}

declare module 'vue-router' {
  interface TypesConfig {
    Router: import('@delta-comic/utils').DeltaRouter
    $router: import('@delta-comic/utils').DeltaRouter
  }
  interface RouterClassic {
    force: import('@delta-comic/utils').DeltaRouterForce
  }
}
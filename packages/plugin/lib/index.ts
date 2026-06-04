import type { uni } from '@delta-comic/model'

declare module '@delta-comic/utils' {
  export interface SharedFunctions {
    routeToContent(
      contentType_: uni.content.ContentType_,
      id: string,
      ep: string,
      preload?: uni.item.Item,
    ): PromiseLike<any>
    routeToSearch(
      input: string,
      source?: [plugin: string, name: string],
      sort?: string,
    ): PromiseLike<any>

    triggerSharePopup(page: uni.content.ContentPage): PromiseLike<void>
    triggerShareToken(token: string): PromiseLike<void>
    pushShareToken(token: string): PromiseLike<void>
  }
}

export * from './plugin'
export * from './config'
export * from './depends'
export * from './global'
export * from './driver'

export * from './env'
export type { App as CloudServer } from '../app'
import { treaty } from '@elysia/eden'

import type { App } from '../app'

export const OFFICIAL_SERVER_URL = ''

/**
 * @param url OFFICIAL_SERVER_URL
 */
export function useCloudServer(url = OFFICIAL_SERVER_URL) {
  const client = treaty<App>(url)

  return client
}
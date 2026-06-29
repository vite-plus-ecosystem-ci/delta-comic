import Elysia from 'elysia'

import { authModule } from '../modules/auth/auth.module'
import { syncModule } from '../modules/sync/sync.module'
import { ok } from '../shared/response'

export const v1 = new Elysia({ prefix: '/v1' })
  .get('/health', () => ok({ service: 'delta-comic-server', status: 'ok' as const }))
  .use(authModule)
  .use(syncModule)
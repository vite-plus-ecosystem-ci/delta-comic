import Elysia from 'elysia'

import { requireAuth } from '@/shared/http/authGuard'
import { ok } from '@/shared/response'

import { syncPullSchema, syncPushSchema, syncSnapshotSchema } from './sync.schemas'
import { SyncService } from './sync.service'

import type { SyncPullRequest, SyncPushRequest, SyncSnapshotRequest } from './sync.types'

export const syncRoutes = new Elysia({ prefix: '/sync' })
  .post(
    '/snapshot',
    async ({ body, request }) => {
      const auth = await requireAuth(request)
      return ok(await SyncService.fromRequest(request).snapshot(auth, body as SyncSnapshotRequest))
    },
    { body: syncSnapshotSchema },
  )
  .post(
    '/push',
    async ({ body, request }) => {
      const auth = await requireAuth(request)
      return ok(await SyncService.fromRequest(request).push(auth, body as SyncPushRequest))
    },
    { body: syncPushSchema },
  )
  .post(
    '/pull',
    async ({ body, request }) => {
      const auth = await requireAuth(request)
      return ok(await SyncService.fromRequest(request).pull(auth, body as SyncPullRequest))
    },
    { body: syncPullSchema },
  )
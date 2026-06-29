import { t } from 'elysia'

import { syncCollectionNames } from './collections'

const collectionSchema = t.Union(syncCollectionNames.map(name => t.Literal(name)))
const actionSchema = t.Union([t.Literal('upsert'), t.Literal('delete')])

export const syncOperationSchema = t.Object({
  action: actionSchema,
  baseVersion: t.Optional(t.String()),
  clientChangedAt: t.Number(),
  collection: collectionSchema,
  data: t.Optional(t.Any()),
  dataHash: t.Optional(t.String()),
  entityId: t.String({ maxLength: 512, minLength: 1 }),
  opId: t.String({ maxLength: 160, minLength: 1 }),
})

export const syncPushSchema = t.Object({
  operations: t.Array(syncOperationSchema),
  schemaVersion: t.Literal(1),
})

export const syncSnapshotSchema = t.Object({
  collections: t.Record(t.String(), t.Array(t.Any())),
  schemaVersion: t.Literal(1),
  snapshotId: t.String({ maxLength: 120, minLength: 1 }),
})

export const syncPullSchema = t.Object({
  collections: t.Optional(t.Array(collectionSchema)),
  includeOwn: t.Optional(t.Boolean()),
  limit: t.Optional(t.Number()),
  schemaVersion: t.Optional(t.Literal(1)),
  sinceSeq: t.Number({ minimum: 0 }),
})
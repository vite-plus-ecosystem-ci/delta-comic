import { all, first, run } from '@/infrastructure/d1/database'

import type {
  NormalizedSyncOperation,
  SyncAction,
  SyncChangeRow,
  SyncCollection,
  SyncEntityRow,
  SyncOpRow,
  SyncOperationResult,
} from './sync.types'

const PROCESSING_ERROR_CODE = 'SYNC_PROCESSING'

export class SyncRepository {
  constructor(private readonly db: D1Database) {}

  async findOperation(
    userId: string,
    terminalUuid: string,
    opId: string,
  ): Promise<SyncOpRow | null> {
    return (await first(
      this.db,
      `SELECT * FROM sync_ops
       WHERE user_id = ? AND terminal_uuid = ? AND op_id = ?
       LIMIT 1`,
      userId,
      terminalUuid,
      opId,
    )) as SyncOpRow | null
  }

  async claimOperation(input: {
    operation: NormalizedSyncOperation
    receivedAt: number
    terminalUuid: string
    userId: string
  }): Promise<boolean> {
    const result = await run(
      this.db,
      `INSERT OR IGNORE INTO sync_ops
       (user_id, terminal_uuid, op_id, collection, entity_id, action, data_hash,
        base_version, result, server_seq, entity_version, error_code, error_message, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.userId,
      input.terminalUuid,
      input.operation.opId,
      input.operation.collection,
      input.operation.entityId,
      input.operation.action,
      input.operation.dataHash,
      input.operation.baseVersion ?? null,
      'failed',
      null,
      null,
      PROCESSING_ERROR_CODE,
      'operation processing was interrupted before completion',
      input.receivedAt,
    )
    return (result.meta.changes ?? 0) > 0
  }

  async findEntity(
    userId: string,
    collection: SyncCollection,
    entityId: string,
  ): Promise<SyncEntityRow | null> {
    return (await first(
      this.db,
      `SELECT * FROM sync_entities
       WHERE user_id = ? AND collection = ? AND entity_id = ?
       LIMIT 1`,
      userId,
      collection,
      entityId,
    )) as SyncEntityRow | null
  }

  async upsertEntity(input: {
    deletedAt: number | null
    operation: NormalizedSyncOperation
    serverUpdatedAt: number
    terminalUuid: string
    userId: string
  }): Promise<void> {
    await run(
      this.db,
      `INSERT INTO sync_entities
       (user_id, collection, entity_id, data_json, data_hash, version, client_changed_at,
        server_updated_at, deleted_at, last_terminal_uuid, last_op_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, collection, entity_id) DO UPDATE SET
         data_json = excluded.data_json,
         data_hash = excluded.data_hash,
         version = excluded.version,
         client_changed_at = excluded.client_changed_at,
         server_updated_at = excluded.server_updated_at,
         deleted_at = excluded.deleted_at,
         last_terminal_uuid = excluded.last_terminal_uuid,
         last_op_id = excluded.last_op_id`,
      input.userId,
      input.operation.collection,
      input.operation.entityId,
      input.operation.dataJson,
      input.operation.dataHash,
      input.operation.version,
      input.operation.clientChangedAt,
      input.serverUpdatedAt,
      input.deletedAt,
      input.terminalUuid,
      input.operation.opId,
    )
  }

  async insertChange(input: {
    deletedAt: number | null
    operation: NormalizedSyncOperation
    serverChangedAt: number
    terminalUuid: string
    userId: string
  }): Promise<number> {
    const inserted = await first<{ server_seq: number }>(
      this.db,
      `INSERT OR IGNORE INTO sync_changes
       (user_id, collection, entity_id, action, data_json, data_hash, version,
        client_changed_at, server_changed_at, deleted_at, origin_terminal_uuid, origin_op_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING server_seq`,
      input.userId,
      input.operation.collection,
      input.operation.entityId,
      input.operation.action,
      input.operation.dataJson,
      input.operation.dataHash,
      input.operation.version,
      input.operation.clientChangedAt,
      input.serverChangedAt,
      input.deletedAt,
      input.terminalUuid,
      input.operation.opId,
    )
    if (inserted) return inserted.server_seq
    const existing = await first<{ server_seq: number }>(
      this.db,
      `SELECT server_seq FROM sync_changes
       WHERE user_id = ? AND origin_terminal_uuid = ? AND origin_op_id = ?
       LIMIT 1`,
      input.userId,
      input.terminalUuid,
      input.operation.opId,
    )
    return existing?.server_seq ?? 0
  }

  async updateOperationResult(input: {
    entityVersion: string | null
    errorCode?: string | null
    errorMessage?: string | null
    opId: string
    result: SyncOperationResult
    serverSeq: number | null
    terminalUuid: string
    userId: string
  }): Promise<void> {
    await run(
      this.db,
      `UPDATE sync_ops
       SET result = ?, server_seq = ?, entity_version = ?, error_code = ?, error_message = ?
       WHERE user_id = ? AND terminal_uuid = ? AND op_id = ?`,
      input.result,
      input.serverSeq,
      input.entityVersion,
      input.errorCode ?? null,
      input.errorMessage ?? null,
      input.userId,
      input.terminalUuid,
      input.opId,
    )
  }

  async latestSeq(userId: string): Promise<number> {
    const row = await first<{ latest_seq: number }>(
      this.db,
      'SELECT COALESCE(MAX(server_seq), 0) AS latest_seq FROM sync_changes WHERE user_id = ?',
      userId,
    )
    return row?.latest_seq ?? 0
  }

  async pullChanges(input: {
    collections: SyncCollection[]
    includeOwn: boolean
    limit: number
    sinceSeq: number
    terminalUuid: string
    userId: string
  }): Promise<SyncChangeRow[]> {
    const values: unknown[] = [input.userId, input.sinceSeq]
    const clauses = ['user_id = ?', 'server_seq > ?']
    if (input.collections.length > 0) {
      clauses.push(`collection IN (${input.collections.map(() => '?').join(', ')})`)
      values.push(...input.collections)
    }
    if (!input.includeOwn) {
      clauses.push('origin_terminal_uuid <> ?')
      values.push(input.terminalUuid)
    }

    return (await all(
      this.db,
      `SELECT * FROM sync_changes
       WHERE ${clauses.join(' AND ')}
       ORDER BY server_seq ASC
       LIMIT ?`,
      ...values,
      input.limit,
    )) as SyncChangeRow[]
  }

  async upsertCursor(input: {
    lastPulledSeq: number
    lastSeenAt: number
    terminalUuid: string
    userId: string
  }): Promise<void> {
    await run(
      this.db,
      `INSERT INTO sync_terminal_cursors
       (user_id, terminal_uuid, last_pulled_seq, last_pushed_at, last_seen_at)
       VALUES (?, ?, ?, NULL, ?)
       ON CONFLICT(user_id, terminal_uuid) DO UPDATE SET
         last_pulled_seq = excluded.last_pulled_seq,
         last_seen_at = excluded.last_seen_at`,
      input.userId,
      input.terminalUuid,
      input.lastPulledSeq,
      input.lastSeenAt,
    )
  }

  async markTerminalPushed(input: {
    lastPushedAt: number
    terminalUuid: string
    userId: string
  }): Promise<void> {
    await run(
      this.db,
      `INSERT INTO sync_terminal_cursors
       (user_id, terminal_uuid, last_pulled_seq, last_pushed_at, last_seen_at)
       VALUES (?, ?, 0, ?, ?)
       ON CONFLICT(user_id, terminal_uuid) DO UPDATE SET
         last_pushed_at = excluded.last_pushed_at,
         last_seen_at = excluded.last_seen_at`,
      input.userId,
      input.terminalUuid,
      input.lastPushedAt,
      input.lastPushedAt,
    )
  }
}

export const isProcessingOp = (row: SyncOpRow): boolean =>
  row.result === 'failed' && row.error_code === PROCESSING_ERROR_CODE

export const toReplayedResult = (row: SyncOpRow) => ({
  collection: row.collection,
  entityId: row.entity_id,
  opId: row.op_id,
  ...(row.error_code && row.error_message
    ? { error: { code: row.error_code, message: row.error_message } }
    : {}),
  ...(row.entity_version ? { entityVersion: row.entity_version } : {}),
  result: row.result === 'applied' ? 'replayed' : row.result,
  ...(row.server_seq === null ? {} : { serverSeq: row.server_seq }),
})

export const actionFromDeletedAt = (deletedAt: number | null): SyncAction =>
  deletedAt === null ? 'upsert' : 'delete'
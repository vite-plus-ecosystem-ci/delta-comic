import type { syncCollections } from './collections'

export type SyncCollection = keyof typeof syncCollections
export type SyncAction = 'upsert' | 'delete'
export type SyncOperationResult = 'applied' | 'replayed' | 'ignored_stale' | 'conflict' | 'failed'

export interface SyncEntityRow {
  user_id: string
  collection: SyncCollection
  entity_id: string
  data_json: string | null
  data_hash: string
  version: string
  client_changed_at: number
  server_updated_at: number
  deleted_at: number | null
  last_terminal_uuid: string
  last_op_id: string
}

export interface SyncChangeRow {
  server_seq: number
  user_id: string
  collection: SyncCollection
  entity_id: string
  action: SyncAction
  data_json: string | null
  data_hash: string
  version: string
  client_changed_at: number
  server_changed_at: number
  deleted_at: number | null
  origin_terminal_uuid: string
  origin_op_id: string
}

export interface SyncOpRow {
  user_id: string
  terminal_uuid: string
  op_id: string
  collection: SyncCollection
  entity_id: string
  action: SyncAction
  data_hash: string
  base_version: string | null
  result: SyncOperationResult
  server_seq: number | null
  entity_version: string | null
  error_code: string | null
  error_message: string | null
  received_at: number
}

export interface SyncPushOperation {
  opId: string
  collection: SyncCollection
  entityId: string
  action: SyncAction
  data?: unknown
  dataHash?: string
  baseVersion?: string
  clientChangedAt: number
}

export interface NormalizedSyncOperation extends SyncPushOperation {
  dataJson: string | null
  dataHash: string
  version: string
}

export interface SyncSnapshotRequest {
  schemaVersion: 1
  snapshotId: string
  collections: Partial<Record<SyncCollection, unknown[]>>
}

export interface SyncPushRequest {
  schemaVersion: 1
  operations: SyncPushOperation[]
}

export interface SyncPullRequest {
  sinceSeq: number
  limit?: number
  collections?: SyncCollection[]
  includeOwn?: boolean
}

export interface SyncPushItemResult {
  opId: string
  collection: SyncCollection
  entityId: string
  result: SyncOperationResult
  serverSeq?: number
  entityVersion?: string
  error?: {
    code: string
    message: string
  }
}

export interface SyncCheckpoint {
  latestSeq: number
  serverTime: number
}

export interface SyncPushResponse {
  results: SyncPushItemResult[]
  checkpoint: SyncCheckpoint
}

export interface SyncChange {
  serverSeq: number
  collection: SyncCollection
  entityId: string
  action: SyncAction
  data?: unknown
  dataHash: string
  version: string
  clientChangedAt: number
  serverChangedAt: number
  deletedAt?: number
  originTerminalUuid: string
  originOpId: string
}

export interface SyncPullResponse {
  checkpoint: {
    sinceSeq: number
    nextSeq: number
    latestSeq: number
    hasMore: boolean
  }
  changes: SyncChange[]
}
import { getRuntime } from '@/env'

export const getDb = (request: Request): D1Database => getRuntime(request).env.DB

export const first = async <T>(
  db: D1Database,
  sql: string,
  ...values: unknown[]
): Promise<T | null> => {
  const row = await db.prepare(sql).bind(...values).first<Record<string, unknown>>()
  return row as T | null
}

export const all = async <T>(
  db: D1Database,
  sql: string,
  ...values: unknown[]
): Promise<T[]> => {
  const result = await db.prepare(sql).bind(...values).all<Record<string, unknown>>()
  return result.results as T[]
}

export const run = async (
  db: D1Database,
  sql: string,
  ...values: unknown[]
): Promise<D1Result<Record<string, unknown>>> => await db.prepare(sql).bind(...values).run()
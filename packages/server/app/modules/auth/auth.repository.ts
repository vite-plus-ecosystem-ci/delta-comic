import { first, run } from '@/infrastructure/d1/database'

import type { AuthSessionRow, AuthTerminalRow, AuthUserRow } from './auth.types'

export class AuthRepository {
  constructor(private readonly db: D1Database) {}

  async findUserByLoginName(loginName: string): Promise<AuthUserRow | null> {
    return (await first(
      this.db,
      'SELECT * FROM auth_users WHERE login_name = ? LIMIT 1',
      loginName,
    )) as AuthUserRow | null
  }

  async findUserById(id: string): Promise<AuthUserRow | null> {
    return (await first(
      this.db,
      'SELECT * FROM auth_users WHERE id = ? LIMIT 1',
      id,
    )) as AuthUserRow | null
  }

  async createUser(row: AuthUserRow): Promise<void> {
    await run(
      this.db,
      `INSERT INTO auth_users
       (id, login_name, password_hash, password_salt, password_alg, created_at, updated_at, disabled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      row.id,
      row.login_name,
      row.password_hash,
      row.password_salt,
      row.password_alg,
      row.created_at,
      row.updated_at,
      row.disabled_at,
    )
  }

  async upsertTerminal(row: AuthTerminalRow): Promise<void> {
    await run(
      this.db,
      `INSERT INTO auth_terminals
       (user_id, terminal_uuid, display_name, platform, app_version, created_at, last_seen_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, terminal_uuid) DO UPDATE SET
         display_name = excluded.display_name,
         platform = excluded.platform,
         app_version = excluded.app_version,
         last_seen_at = excluded.last_seen_at,
         revoked_at = NULL`,
      row.user_id,
      row.terminal_uuid,
      row.display_name,
      row.platform,
      row.app_version,
      row.created_at,
      row.last_seen_at,
      row.revoked_at,
    )
  }

  async findTerminal(userId: string, terminalUuid: string): Promise<AuthTerminalRow | null> {
    return (await first(
      this.db,
      'SELECT * FROM auth_terminals WHERE user_id = ? AND terminal_uuid = ? LIMIT 1',
      userId,
      terminalUuid,
    )) as AuthTerminalRow | null
  }

  async createSession(row: AuthSessionRow): Promise<void> {
    await run(
      this.db,
      `INSERT INTO auth_sessions
       (id, user_id, terminal_uuid, access_token_hash, refresh_token_hash, created_at,
        access_expires_at, refresh_expires_at, rotated_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.id,
      row.user_id,
      row.terminal_uuid,
      row.access_token_hash,
      row.refresh_token_hash,
      row.created_at,
      row.access_expires_at,
      row.refresh_expires_at,
      row.rotated_at,
      row.revoked_at,
    )
  }

  async findSessionByAccessTokenHash(accessTokenHash: string): Promise<AuthSessionRow | null> {
    return (await first(
      this.db,
      'SELECT * FROM auth_sessions WHERE access_token_hash = ? LIMIT 1',
      accessTokenHash,
    )) as AuthSessionRow | null
  }

  async findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSessionRow | null> {
    return (await first(
      this.db,
      'SELECT * FROM auth_sessions WHERE refresh_token_hash = ? LIMIT 1',
      refreshTokenHash,
    )) as AuthSessionRow | null
  }

  async revokeSession(sessionId: string, revokedAt: number): Promise<void> {
    await run(
      this.db,
      'UPDATE auth_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL',
      revokedAt,
      sessionId,
    )
  }

  async rotateSession(
    oldSessionId: string,
    oldRotatedAt: number,
    newSession: AuthSessionRow,
  ): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          'UPDATE auth_sessions SET rotated_at = ?, revoked_at = ? WHERE id = ? AND revoked_at IS NULL',
        )
        .bind(oldRotatedAt, oldRotatedAt, oldSessionId),
      this.db
        .prepare(
          `INSERT INTO auth_sessions
           (id, user_id, terminal_uuid, access_token_hash, refresh_token_hash, created_at,
            access_expires_at, refresh_expires_at, rotated_at, revoked_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          newSession.id,
          newSession.user_id,
          newSession.terminal_uuid,
          newSession.access_token_hash,
          newSession.refresh_token_hash,
          newSession.created_at,
          newSession.access_expires_at,
          newSession.refresh_expires_at,
          newSession.rotated_at,
          newSession.revoked_at,
        ),
    ])
  }
}
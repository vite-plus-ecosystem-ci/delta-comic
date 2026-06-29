import { t } from 'elysia'

export const terminalSchema = {
  appVersion: t.Optional(t.String({ maxLength: 64 })),
  platform: t.Optional(t.String({ maxLength: 64 })),
  terminalName: t.Optional(t.String({ maxLength: 128 })),
  terminalUuid: t.String({ format: 'uuid' }),
}

export const registerSchema = t.Object({
  ...terminalSchema,
  loginName: t.String({ maxLength: 64, minLength: 3 }),
  password: t.String({ maxLength: 256, minLength: 8 }),
})

export const loginSchema = registerSchema

export const refreshSchema = t.Object({
  refreshToken: t.String({ minLength: 16 }),
})
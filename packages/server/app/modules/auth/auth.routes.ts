import Elysia from 'elysia'

import { requireAuth } from '@/shared/http/authGuard'
import { ok } from '@/shared/response'

import { AuthService } from './auth.service'
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas'

import type { LoginRequest, RefreshRequest, RegisterRequest } from './auth.types'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/register',
    async ({ body, request }) => ok(await AuthService.fromRequest(request).register(body as RegisterRequest)),
    { body: registerSchema },
  )
  .post(
    '/login',
    async ({ body, request }) => ok(await AuthService.fromRequest(request).login(body as LoginRequest)),
    { body: loginSchema },
  )
  .post(
    '/refresh',
    async ({ body, request }) => {
      const input = body as RefreshRequest
      return ok(await AuthService.fromRequest(request).refresh(input.refreshToken))
    },
    { body: refreshSchema },
  )
  .post('/logout', async ({ request }) => {
    const auth = await requireAuth(request)
    return ok(await AuthService.fromRequest(request).logout(auth))
  })
  .get('/me', async ({ request }) => {
    const auth = await requireAuth(request)
    return ok(await AuthService.fromRequest(request).me(auth))
  })
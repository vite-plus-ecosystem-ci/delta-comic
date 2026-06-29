import { AppError } from '@/shared/errors'

import { AuthService } from '../../modules/auth/auth.service'

import type { AuthContext } from '../../modules/auth/auth.types'

export const readBearerToken = (request: Request): string => {
  const authorization = request.headers.get('authorization')
  if (!authorization) throw new AppError('AUTH_MISSING_TOKEN', 'authorization header is required', 401)
  const [scheme, token] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new AppError('AUTH_INVALID_TOKEN', 'authorization header must use Bearer token', 401)
  }
  return token
}

export const requireAuth = async (request: Request): Promise<AuthContext> => {
  const token = readBearerToken(request)
  return await AuthService.fromRequest(request).authenticateAccessToken(token)
}
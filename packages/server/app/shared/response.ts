import { AppError, asPublicError } from './errors'

export interface ApiSuccess<T> {
  ok: true
  data: T
}

export interface ApiFailure {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export const ok = <T>(data: T): ApiSuccess<T> => ({ ok: true, data })

export const fail = (error: AppError): ApiFailure => ({
  ok: false,
  error: {
    code: error.code,
    message: error.message,
    ...(error.details === undefined ? {} : { details: error.details }),
  },
})

const maybeValidationError = (error: unknown): AppError | undefined => {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as { code?: unknown; message?: unknown }
  if (candidate.code === 'VALIDATION') {
    return new AppError('REQUEST_VALIDATION_FAILED', String(candidate.message ?? 'request validation failed'), 400)
  }
  return undefined
}

export const errorResponse = (error: unknown): Response => {
  const publicError = maybeValidationError(error) ?? asPublicError(error)
  return Response.json(fail(publicError), { status: publicError.status })
}
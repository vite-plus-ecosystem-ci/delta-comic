export interface AppEnv {
  DB: D1Database
  AUTH_PEPPER?: string
  TOKEN_PEPPER?: string
  ACCESS_TOKEN_TTL_SECONDS?: string
  REFRESH_TOKEN_TTL_SECONDS?: string
  SYNC_MAX_PUSH_OPS?: string
  SYNC_MAX_PULL_CHANGES?: string
}

export interface AppRuntime {
  env: AppEnv
  ctx: ExecutionContext
}

const runtimeByRequest = new WeakMap<Request, AppRuntime>()

export const bindRuntime = (request: Request, runtime: AppRuntime) => {
  runtimeByRequest.set(request, runtime)
}

export const getRuntime = (request: Request): AppRuntime => {
  const runtime = runtimeByRequest.get(request)
  if (!runtime) throw new Error('Delta Comic server runtime is not bound to this request')
  return runtime
}

export const readNumberVar = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}
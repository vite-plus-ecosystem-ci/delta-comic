import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'

import { bindRuntime, type AppEnv } from './env'
import { cors } from './shared/http/cors'
import { errorResponse } from './shared/response'
import { v1 } from './v1'

const app = new Elysia({ adapter: CloudflareAdapter, prefix: '/api' })
  .use(cors)
  .onError(({ error }) => errorResponse(error))
  .use(v1)

const compiled = app.compile()

export default {
  fetch(request: Request, env: AppEnv, ctx: ExecutionContext) {
    bindRuntime(request, { ctx, env })
    return compiled.fetch(request)
  },
} satisfies ExportedHandler<AppEnv>
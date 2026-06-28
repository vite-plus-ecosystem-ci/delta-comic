import { Elysia } from 'elysia'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'

import { v1 } from './v1'

const app = new Elysia({ adapter: CloudflareAdapter, prefix: '/api' }).use(v1)

export default app.compile()
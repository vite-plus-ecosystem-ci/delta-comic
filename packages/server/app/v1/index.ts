import Elysia from 'elysia'

import { db } from './db'

export const v1 = new Elysia({ prefix: '/vi' }).use(db)
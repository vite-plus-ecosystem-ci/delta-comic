import Elysia from 'elysia'

const toHeaders = (headers: Record<string, unknown>): HeadersInit => {
  const entries = Object.entries(headers).flatMap(([key, value]) =>
    value === undefined ? [] : [[key, String(value)]],
  )
  return Object.fromEntries(entries)
}

export const cors = new Elysia({ name: 'dc-cors' })
  .onRequest(({ request, set }) => {
    const origin = request.headers.get('origin')
    set.headers['access-control-allow-origin'] = origin || '*'
    set.headers['access-control-allow-methods'] = 'GET,POST,OPTIONS'
    set.headers['access-control-allow-headers'] = 'content-type,authorization'
    set.headers['access-control-max-age'] = '86400'
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: toHeaders(set.headers), status: 204 })
    }
  })
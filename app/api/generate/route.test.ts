import { afterEach, describe, expect, it, vi } from 'vitest'
import { rateLimiter, isCrossSite } from '@/lib/agent/rate-limit'
import { POST } from './route'

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(new Request('http://localhost:3000/api/generate', { method: 'POST', headers: { host: 'localhost:3000', 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }))

describe('POST /api/generate', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('rejects malformed bodies with 400', async () => {
    expect((await post('nope')).status).toBe(400)
    expect((await post({ messages: 'x' })).status).toBe(400)
    expect((await post({ messages: [null] })).status).toBe(400)
    expect((await post({ messages: [{ role: 'assistant', content: 'hi' }] })).status).toBe(400)
  })

  it('rejects cross-site browser requests and oversized prompts', async () => {
    expect((await post({ messages: [{ role: 'user', content: 'hi' }] }, { 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect((await post({ messages: [{ role: 'user', content: 'x'.repeat(5000) }] })).status).toBe(413)
  })

  it('refuses Claude Code off loopback and reports a missing gateway key', async () => {
    expect((await post({ engine: 'claude', messages: [{ role: 'user', content: 'hi' }] }, { host: 'ohmyascii.vercel.app' })).status).toBe(403)
    vi.stubEnv('AI_GATEWAY_API_KEY', '')
    vi.stubEnv('VERCEL_OIDC_TOKEN', '')
    expect((await post({ messages: [{ role: 'user', content: 'hi' }] })).status).toBe(503)
  })
})

describe('rateLimiter', () => {
  it('allows `limit` hits per window per key', () => {
    const rl = rateLimiter(2, 1000)
    expect([rl.hit('a', 0), rl.hit('a', 10), rl.hit('a', 20), rl.hit('b', 20)]).toEqual([true, true, false, true])
    expect(rl.hit('a', 1011)).toBe(true)
  })
})

describe('isCrossSite', () => {
  const r = (h: Record<string, string>) => new Request('http://x', { headers: { host: 'a.dev', ...h } })
  it('flags other sites, allows same-origin and non-browser clients', () => {
    expect(isCrossSite(r({ 'sec-fetch-site': 'same-origin', origin: 'https://a.dev' }))).toBe(false)
    expect(isCrossSite(r({}))).toBe(false)
    expect(isCrossSite(r({ origin: 'https://evil.dev' }))).toBe(true)
    expect(isCrossSite(r({ 'sec-fetch-site': 'same-site' }))).toBe(true)
  })
})

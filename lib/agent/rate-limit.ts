// Abuse guards for /api/generate. In-memory, so per server instance: a soft limit that stops a
// single client looping the endpoint. Pair it with a Vercel Firewall rate-limit rule and an AI
// Gateway budget for a hard ceiling (docs/audit-2026-10.md).

export interface RateLimiter {
  /** Records a hit for `key`; false when the key is over the limit (the hit isn't counted). */
  hit(key: string, now?: number): boolean
}

/** Sliding window: at most `limit` hits per `windowMs` per key. */
export function rateLimiter(limit: number, windowMs: number, maxKeys = 10_000): RateLimiter {
  const hits = new Map<string, number[]>()
  return {
    hit(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        return false
      }
      recent.push(now)
      // Re-insert so Map order tracks recency; drop the stalest keys when full.
      hits.delete(key)
      hits.set(key, recent)
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value!)
      return true
    },
  }
}

/** Client IP as reported by the platform proxy (Vercel sets x-forwarded-for / x-real-ip). */
export function clientIp(req: Request): string {
  return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/**
 * A browser request from another site. Same-origin fetches send `Sec-Fetch-Site: same-origin` (or
 * an `Origin` matching `Host`); non-browser clients send neither and are left to the rate limit.
 */
export function isCrossSite(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return true
  const origin = req.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host !== req.headers.get('host')
  } catch {
    return true
  }
}

// Requests allowed to drive local processes (the user's Claude Code): development builds only,
// reached over loopback, from the same host. Mirrors robocn's scan-route guard.

const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|::1)(:\d+)?$/i

export function isLoopbackHost(host: string | null | undefined): boolean {
  return !!host && LOOPBACK.test(host.trim())
}

const LOOPBACK_ADDR = /^(127(?:\.\d{1,3}){3}|::1|::ffff:127(?:\.\d{1,3}){3})$/i

export function isLoopbackAddress(addr: string): boolean {
  return LOOPBACK_ADDR.test(addr.replace(/^\[|\]$/g, ''))
}

export function isLocalRequest(req: Request, env: string | undefined = process.env.NODE_ENV): boolean {
  if (env === 'production') return false
  const host = req.headers.get('host')
  if (!isLoopbackHost(host)) return false
  // `Host` is client-controlled. Next fills x-forwarded-for from the socket when the client didn't
  // send one, so a LAN peer shows up here — unless it forges the header, which is why `bun run dev`
  // also binds to 127.0.0.1 (`bun run dev:lan` opts out).
  const peer = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (peer && !isLoopbackAddress(peer)) return false
  const origin = req.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

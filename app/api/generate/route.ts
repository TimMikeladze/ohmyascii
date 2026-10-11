import { streamText, type ModelMessage } from 'ai'
import { isSessionId, streamClaude } from '@/lib/agent/claude-cli'
import { isLocalRequest } from '@/lib/agent/local'
import { clientIp, isCrossSite, rateLimiter } from '@/lib/agent/rate-limit'
import { z } from 'zod'
import { buildInstructions } from '@/lib/ascii/world-prompt'

// AI scene generator: a short chat turns a description into a world. Streams plain text — one
// sentence, then a ```json block the studio parses with parseAiReply (lib/ascii/world-prompt.ts).
// Engines: the Vercel AI Gateway (AI_GATEWAY_API_KEY, or the project's OIDC token via `vercel env pull`),
// or — local dev over loopback only — the user's own Claude Code (`claude -p`, docs/local-claude.md).

export const maxDuration = 120

const MODEL = process.env.OHMYASCII_AI_MODEL || 'anthropic/claude-sonnet-5.5'
const MAX_TURNS = 12
/** One user message (a scene description or a change request). */
const MAX_USER_CHARS = 4_000
/** One assistant turn (a full world reply). */
const MAX_ASSISTANT_CHARS = 40_000
/** The scene on screen. */
const MAX_CURRENT_CHARS = 60_000
/** Everything sent to the model in one request. */
const MAX_TOTAL_CHARS = 160_000
/** Gateway requests per client IP (per server instance). */
const limiter = rateLimiter(Number(process.env.OHMYASCII_AI_RATE_LIMIT) || 20, 10 * 60_000)

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .min(1)
    .max(64),
  /** The studio's current world + config (JSON), so follow-ups edit it instead of starting over. */
  current: z.string().max(MAX_CURRENT_CHARS * 2).optional(),
  engine: z.enum(['gateway', 'claude']).optional(),
  /** Claude Code engine: keep one session per chat (`resume` = send only the newest message). */
  session: z.object({ id: z.string(), resume: z.boolean() }).optional(),
})

const fail = (error: string, status: number, headers?: HeadersInit) => Response.json({ error }, { status, headers })

export async function POST(req: Request) {
  if (isCrossSite(req)) return fail('Cross-site requests are not allowed', 403)
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return fail('Invalid JSON body', 400)
  }
  const parsed = Body.safeParse(json)
  if (!parsed.success) return fail('Invalid request: expected { messages: { role, content }[] }', 400)
  const body = parsed.data
  const turns = body.messages.filter((m) => m.content.trim()).slice(-MAX_TURNS)
  if (!turns.length || turns[turns.length - 1].role !== 'user') return fail('Send at least one user message', 400)
  const last = turns[turns.length - 1]
  if (last.content.length > MAX_USER_CHARS) return fail(`Keep the request under ${MAX_USER_CHARS.toLocaleString('en-US')} characters`, 413)
  const messages: ModelMessage[] = turns.map((m) => ({
    role: m.role,
    content: m.content.slice(0, m.role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS),
  }))
  // The current scene rides along with the latest request so edits apply to what's on screen.
  if (body.current) {
    if (body.current.length > MAX_CURRENT_CHARS) return fail('The current scene is too large to send — start fresh or simplify it', 413)
    const newest = messages[messages.length - 1]
    newest.content = `Current scene on screen:\n\`\`\`json\n${body.current}\n\`\`\`\n\n${newest.content as string}`
  }
  // Oldest turns go first when the transcript is over budget.
  const size = () => messages.reduce((n, m) => n + (m.content as string).length, 0)
  while (messages.length > 1 && size() > MAX_TOTAL_CHARS) messages.shift()
  if (messages[0].role !== 'user') messages.shift()

  if (body.engine === 'claude') {
    if (!isLocalRequest(req)) return fail('Claude Code is only available when the studio runs locally (pnpm dev).', 403)
    // With a session, Claude Code keeps the conversation: a resumed run gets only the new message.
    // Without one (or on the first turn), earlier turns go in as a transcript.
    const session = body.session && isSessionId(body.session.id) ? body.session : undefined
    const prompt = session?.resume
      ? (messages[messages.length - 1].content as string)
      : messages.map((m) => (m.role === 'user' ? `USER:\n${m.content as string}` : `ASSISTANT:\n${m.content as string}`)).join('\n\n')
    return new Response(streamClaude({ instructions: buildInstructions(), prompt, model: process.env.OHMYASCII_CLAUDE_MODEL || undefined, signal: req.signal, session }), {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    })
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return fail('AI is not configured: set AI_GATEWAY_API_KEY, or run `vercel env pull` to get an OIDC token.', 503)
  }
  if (!limiter.hit(clientIp(req))) return fail('Too many scenes in a short time — wait a few minutes and try again.', 429, { 'retry-after': '120' })

  const result = streamText({
    model: MODEL,
    instructions: buildInstructions(),
    messages,
    maxOutputTokens: 16_000,
    abortSignal: req.signal,
  })
  // Plain text, with failures appended as a final `⚠ …` line (the same protocol as the Claude
  // engine), so the studio can say what went wrong instead of "no scene in the reply".
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of result.stream) {
          if (part.type === 'text-delta') controller.enqueue(enc.encode(part.text))
          else if (part.type === 'error') throw part.error
          else if (part.type === 'finish' && part.finishReason === 'length')
            controller.enqueue(enc.encode('\n⚠ The reply hit the length limit before the scene was finished — ask for something simpler.'))
        }
      } catch (e) {
        if (!req.signal.aborted) {
          console.error('[generate]', e)
          controller.enqueue(enc.encode(`\n⚠ ${gatewayMessage(e)}`))
        }
      }
      controller.close()
    },
  })
  return new Response(stream, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
}

/** A short, user-facing reason for a gateway failure (no provider internals). */
function gatewayMessage(e: unknown): string {
  const status = (e as { statusCode?: number })?.statusCode
  if (status === 401 || status === 403) return 'The AI Gateway rejected the credentials.'
  if (status === 402) return 'The AI Gateway is out of credit.'
  if (status === 429) return 'The AI Gateway is rate limited — try again shortly.'
  return 'The AI request failed — try again.'
}

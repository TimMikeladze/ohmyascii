'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Clipboard, Square, Sparkles } from 'lucide-react'
import type { AsciiConfig } from '@/lib/ascii/config'
import type { World } from '@/lib/ascii/world'
import { parseAiReply, replyProse } from '@/lib/ascii/world-prompt'
import { cn } from '@/lib/utils'

// Chat with the AI art director: describe a scene, it streams back a world; follow-ups edit the
// scene on screen. See app/api/generate/route.ts.

interface Turn {
  role: 'user' | 'assistant'
  content: string
  /** Assistant turns: what happened to the scene. */
  status?: 'streaming' | 'applied' | 'failed'
  /** Applied turns: the scene they produced, so the chat doubles as a version history. */
  result?: { world: World; config: Partial<AsciiConfig> }
}

const IDEAS = [
  'A lighthouse on a cliff in a storm, rain and crashing waves',
  'Bioluminescent jellyfish forest in the deep sea',
  'Floating islands with waterfalls above clouds',
  'A 2D Japanese ink painting: moon, cranes and pine',
  'Saturn rising over an icy moon',
  'A neon koi swimming through a vaporwave sunset',
]

type Engine = 'claude' | 'gateway'

interface AgentStatus {
  local: boolean
  claude: { installed: boolean; version?: string }
  gateway: boolean
}

export interface AiPanelProps {
  /** JSON of the scene on screen (world + config), sent so follow-ups edit it. */
  current: () => string | null
  onApply: (world: World, config: Partial<AsciiConfig>, prompt: string) => void
  /** Handoff prompt for a coding agent in the user's terminal (lib/ascii/handoff.ts). */
  handoff: (request: string) => string
  onCopy: (text: string) => void
  /** A prompt handed in from outside (the home page's composer, via /studio?q=): sent once, fresh. */
  autoPrompt?: string | null
}

const ENGINE_KEY = 'ohmyascii:ai-engine'

/** History for the model: failed exchanges (error text, half replies) are left out. */
function sendable(turns: Turn[]): { role: Turn['role']; content: string }[] {
  const out: { role: Turn['role']; content: string }[] = []
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i]
    if (t.role === 'user' && turns[i + 1]?.status === 'failed') continue
    if (t.status === 'failed') continue
    out.push({ role: t.role, content: t.content })
  }
  return out
}

export function AiPanel({ current, onApply, handoff, onCopy, autoPrompt }: AiPanelProps) {
  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [engine, setEngine] = useState<Engine>('gateway')
  // Prefer the user's own Claude Code when the studio runs locally and `claude` is installed.
  useEffect(() => {
    let alive = true
    fetch('/api/agent')
      .then((r) => r.json() as Promise<AgentStatus>)
      .then((s) => {
        if (!alive) return
        setStatus(s)
        let saved: string | null = null
        try {
          saved = localStorage.getItem(ENGINE_KEY)
        } catch {}
        const canClaude = s.local && s.claude.installed
        setEngine(saved === 'gateway' && s.gateway ? 'gateway' : canClaude ? 'claude' : 'gateway')
      })
      // Unknown status: offer the gateway, so a prompt handed in from the home page still sends
      // (and fails with a reason rather than silently).
      .catch(() => alive && setStatus({ local: false, claude: { installed: false }, gateway: false }))
    return () => {
      alive = false
    }
  }, [])
  const pickEngine = (e: Engine) => {
    // A Claude session only knows its own turns; switching engines starts a new one next time.
    if (e !== engine) sessionRef.current = null
    setEngine(e)
    try {
      localStorage.setItem(ENGINE_KEY, e)
    } catch {}
  }
  const claudeOk = !!status?.local && !!status.claude.installed
  const [turns, setTurns] = useState<Turn[]>([])
  // Claude Code session for this chat: created on the first Claude turn, resumed after that.
  const sessionRef = useRef<{ id: string; started: boolean } | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [fresh, setFresh] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  // One screen-reader announcement per turn (the conversation itself streams silently).
  const [announce, setAnnounce] = useState('')
  const listRef = useRef<HTMLOListElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [turns])
  useEffect(() => () => abortRef.current?.abort(), [])

  const send = async (text: string, opts?: { fresh?: boolean }) => {
    const prompt = text.trim()
    if (!prompt || busy) return
    const startFresh = opts?.fresh ?? fresh
    const history: Turn[] = [...turns, { role: 'user', content: prompt }]
    setTurns([...history, { role: 'assistant', content: '', status: 'streaming' }])
    setAnnounce('Generating scene…')
    setDraft('')
    setBusy(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    let full = ''
    const useSession = engine === 'claude' && typeof crypto.randomUUID === 'function'
    if (useSession && !sessionRef.current) sessionRef.current = { id: crypto.randomUUID(), started: false }
    const session = useSession && sessionRef.current ? { id: sessionRef.current.id, resume: sessionRef.current.started } : undefined
    const setLast = (patch: Partial<Turn>) => setTurns((ts) => ts.map((t, i) => (i === ts.length - 1 ? { ...t, ...patch } : t)))
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ engine, session, messages: sendable(history), current: startFresh ? undefined : (current() ?? undefined) }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? `Request failed (${res.status})`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setLast({ content: full })
      }
      const reply = parseAiReply(full)
      const engineError = full.match(/\n⚠ ([^\n]*)$/)?.[1]
      if (!reply.world) throw new Error(engineError || reply.text || 'The reply did not contain a scene — try rephrasing.')
      if (session && sessionRef.current) sessionRef.current.started = true
      onApply(reply.world, reply.config, prompt)
      setLast({ content: full, status: 'applied', result: { world: reply.world, config: reply.config } })
      setFresh(false)
      setAnnounce(`Scene applied. ${replyProse(full)}`)
    } catch (e) {
      // A run that failed may have left a half-written session; the next turn starts a fresh one
      // with the transcript.
      if (session) sessionRef.current = null
      const aborted = (e as Error).name === 'AbortError'
      const message = aborted ? `${replyProse(full)} (stopped)` : (e as Error).message
      setLast({ content: message, status: 'failed' })
      setAnnounce(aborted ? 'Stopped.' : `Not applied: ${message}`)
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const lastApplied = turns.findLastIndex((t) => t.status === 'applied')

  // A handoff prompt (home page composer, ?q=) is sent once — after the engine status resolves so
  // it uses the right engine, and fresh so it ignores whatever world the session restored.
  const sentAutoRef = useRef(false)
  useEffect(() => {
    if (!status || sentAutoRef.current) return
    sentAutoRef.current = true
    if (!autoPrompt) return
    void send(autoPrompt, { fresh: true })
    // Stacked layout (phones): the chat sits below the canvas — bring it into view.
    if (window.matchMedia('(max-width: 1023px)').matches) rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [status, autoPrompt, send])

  return (
    <div ref={rootRef} className="flex scroll-mt-4 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Engine</span>
        <div
          role="radiogroup"
          aria-label="AI engine"
          className="grid grid-cols-2 border border-border"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
            e.preventDefault()
            pickEngine(engine === 'claude' ? 'gateway' : 'claude')
            ;(e.currentTarget.querySelector('[aria-checked="false"]') as HTMLElement | null)?.focus()
          }}
        >
          {(
            [
              ['claude', 'Claude Code', claudeOk, claudeOk ? `Your local Claude Code ${status?.claude.version ?? ''} and its login — no API key, tools disabled` : 'Needs the studio on localhost with `claude` installed'],
              ['gateway', 'Gateway', !!status?.gateway, status?.gateway ? 'Vercel AI Gateway' : 'Not configured on this server'],
            ] as const
          ).map(([value, label, ok, hint]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={engine === value}
              tabIndex={engine === value ? 0 : -1}
              disabled={busy}
              title={hint}
              onClick={() => pickEngine(value)}
              className={cn(
                'h-7 px-2.5 text-[11px] tracking-wide uppercase transition-colors',
                engine === value ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                !ok && engine !== value && 'opacity-50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {status && engine === 'claude' && !claudeOk && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {status.local
            ? 'Claude Code is not installed: npm i -g @anthropic-ai/claude-code, run `claude` once to log in, then reload.'
            : 'Claude Code only runs when the studio is served locally (pnpm dev). Use Gateway here.'}
        </p>
      )}
      {status && engine === 'gateway' && !status.gateway && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">Gateway is not configured: set AI_GATEWAY_API_KEY or run `vercel env pull`.</p>
      )}
      {turns.length > 0 && (
        <ol ref={listRef} aria-label="Conversation" aria-busy={busy} className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {turns.map((t, i) => (
            <li key={i} className={cn('text-xs leading-relaxed', t.role === 'user' ? 'self-end border border-border bg-accent/40 px-2 py-1.5' : 'text-muted-foreground')}>
              {t.role === 'user' ? (
                t.content
              ) : (
                <>
                  <span className="text-foreground">{replyProse(t.content) || (t.status === 'streaming' ? 'Thinking…' : '')}</span>
                  {t.status === 'streaming' && t.content.includes('```') && (
                    <span className="block text-[11px] tracking-widest uppercase motion-safe:animate-pulse">Building scene · {Math.round(t.content.length / 100) / 10}k</span>
                  )}
                  {t.status === 'applied' && (
                    <span className="flex items-center gap-2 text-[11px] tracking-widest uppercase">
                      ✓ Applied
                      {t.result && i !== lastApplied ? (
                        <button
                          type="button"
                          disabled={busy}
                          title="Put the scene back to how this turn left it (undoable)"
                          onClick={() => {
                            const prompt = turns[i - 1]?.content ?? ''
                            onApply(t.result!.world, t.result!.config, prompt)
                            setAnnounce('Scene restored.')
                          }}
                          className="border border-dashed border-border px-1.5 hover:border-foreground hover:text-foreground"
                        >
                          Restore
                        </button>
                      ) : (
                        <span>· ⌘Z to undo</span>
                      )}
                    </span>
                  )}
                  {t.status === 'failed' && <span className="block text-[11px] tracking-widest text-destructive uppercase">Not applied</span>}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      <p role="status" className="sr-only">
        {announce}
      </p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
      >
        <div className="flex items-end gap-2 border border-border focus-within:border-foreground">
          <textarea
            aria-label="Describe a scene"
            rows={2}
            value={draft}
            placeholder={turns.length ? 'Change something… “make it night”, “add a second moon”' : 'A quiet harbour at dawn, boats bobbing…'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send(draft)
              }
            }}
            className="min-h-14 flex-1 resize-none bg-transparent px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {busy ? (
            <button type="button" aria-label="Stop" className="m-1.5 flex size-7 items-center justify-center border border-border hover:bg-foreground hover:text-background" onClick={() => abortRef.current?.abort()}>
              <Square className="size-3" aria-hidden />
            </button>
          ) : (
            <button type="submit" aria-label="Generate" disabled={!draft.trim()} className="m-1.5 flex size-7 items-center justify-center bg-foreground text-background disabled:opacity-40">
              <ArrowUp className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          <label className="flex items-center gap-1.5" title="Ignore the scene on screen and start a new one">
            <input type="checkbox" checked={fresh} onChange={(e) => setFresh(e.target.checked)} className="accent-foreground" />
            Start fresh
          </label>
          {turns.length > 0 && !busy && (
            <button
              type="button"
              className="tracking-widest uppercase hover:text-foreground"
              onClick={() => {
                setTurns([])
                sessionRef.current = null
              }}
            >
              <Sparkles className="mr-1 inline size-3" aria-hidden />
              New chat
            </button>
          )}
          {turns.length === 0 && !busy && (
            <button
              type="button"
              title="Generate a random example scene"
              onClick={() => send(IDEAS[Math.floor(Math.random() * IDEAS.length)])}
              className="inline-flex items-center gap-1 tracking-widest uppercase hover:text-foreground"
            >
              <Sparkles className="size-3" aria-hidden />
              Surprise me
            </button>
          )}
          <button
            type="button"
            title="Copy a prompt for Claude Code (or Codex / opencode) running in your terminal — it edits the piece file and the studio renders it live"
            onClick={() => onCopy(handoff(draft || [...turns].reverse().find((t) => t.role === 'user')?.content || ''))}
            className="ml-auto inline-flex items-center gap-1 tracking-widest uppercase hover:text-foreground"
          >
            <Clipboard className="size-3" aria-hidden />
            For terminal
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  // Remember which sections the user opened or closed across visits.
  const ref = useRef<HTMLDetailsElement>(null)
  const storageKey = `ohmyascii:section:${title}`
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved !== null && ref.current) ref.current.open = saved === '1'
    } catch {}
  }, [storageKey])
  return (
    <details
      ref={ref}
      open={defaultOpen}
      onToggle={(e) => {
        try {
          localStorage.setItem(storageKey, e.currentTarget.open ? '1' : '0')
        } catch {}
      }}
      className="group border-b border-dashed border-border"
    >
      <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 text-xs font-medium tracking-widest text-foreground uppercase select-none hover:bg-accent/40">
        {title}
        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
      </summary>
      <div className="flex flex-col gap-4 px-5 pt-1 pb-5">{children}</div>
    </details>
  )
}

function Label({ id, children, value }: { id: string; children: ReactNode; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <label htmlFor={id} className="text-muted-foreground">
        {children}
      </label>
      {value !== undefined && <span className="tabular-nums text-foreground">{value}</span>}
    </div>
  )
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  defaultValue,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  /** Double-clicking the slider restores this value; a dot marks when it differs. */
  defaultValue?: number
}) {
  const id = useId()
  const [editing, setEditing] = useState(false)
  const modified = defaultValue !== undefined && value !== defaultValue
  const display = format ? format(value) : String(Number(value.toFixed(3)))
  const commitDraft = (raw: string) => {
    setEditing(false)
    const n = Number.parseFloat(raw)
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)))
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <label htmlFor={id} className="flex items-center gap-1.5 text-muted-foreground">
          {label}
          {modified && <span aria-label="modified" title="Changed from default — double-click the slider to reset" className="size-1 rounded-full bg-foreground" />}
        </label>
        {editing ? (
          <input
            autoFocus
            type="number"
            aria-label={`${label} value`}
            defaultValue={Number(value.toFixed(3))}
            min={min}
            max={max}
            step={step}
            onBlur={(e) => commitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitDraft(e.currentTarget.value)
              else if (e.key === 'Escape') setEditing(false)
            }}
            className="h-5 w-20 border border-border bg-background px-1 text-right text-xs tabular-nums text-foreground"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Click to type a value"
            className="tabular-nums text-foreground hover:underline hover:decoration-dashed focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed"
          >
            {display}
          </button>
        )}
      </div>
      <input
        id={id}
        type="range"
        className="ctl-range w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue)}
      />
    </div>
  )
}

export function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <label htmlFor={id} className="text-muted-foreground">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative h-5 w-9 border transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2',
          value ? 'border-foreground bg-foreground' : 'border-border bg-transparent',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-3.5 transition-all',
            value ? 'left-[1.15rem] bg-background' : 'left-0.5 bg-muted-foreground',
          )}
        />
      </button>
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 w-full border border-border bg-background px-2 text-xs text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  hideLabel?: boolean
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className={cn('text-xs text-muted-foreground', hideLabel && 'sr-only')}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className="grid auto-cols-fr grid-flow-col border border-border"
        onKeyDown={(e) => {
          // Radio-group keys: arrows move the selection (and focus) within the group.
          const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
          if (!dir) return
          e.preventDefault()
          e.stopPropagation()
          const i = (options.findIndex((o) => o.value === value) + dir + options.length) % options.length
          onChange(options[i].value)
          ;(e.currentTarget.children[i] as HTMLElement | undefined)?.focus()
        }}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            tabIndex={value === o.value || (!options.some((x) => x.value === value) && o === options[0]) ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-8 px-1 text-[11px] tracking-wide uppercase transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:-outline-offset-4',
              value === o.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <label htmlFor={id} className="text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="tabular-nums text-foreground uppercase">{value}</span>
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-6 cursor-pointer border border-border bg-transparent p-0"
        />
      </div>
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  mono = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  mono?: boolean
}) {
  const id = useId()
  const className = cn(
    'w-full border border-border bg-background px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2',
    mono && 'font-mono',
  )
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id}>{label}</Label>
      {multiline ? (
        <textarea
          id={id}
          rows={2}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(className, 'resize-none')}
        />
      ) : (
        <input id={id} type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={className} />
      )}
    </div>
  )
}

export function ChipRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-xs text-muted-foreground">
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-7 border px-2.5 text-[11px] tracking-wide uppercase transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2',
              value === o.value
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A nested, collapsed-by-default group inside a section ("More", per-object sub-groups). */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  meta,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  /** Short summary shown next to the title (e.g. a count). */
  meta?: ReactNode
}) {
  return (
    <details open={defaultOpen} className="group/d border-t border-dashed border-border">
      <summary className="flex cursor-pointer items-center gap-1.5 pt-3 text-[11px] tracking-widest text-muted-foreground uppercase select-none hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3 transition-transform group-open/d:rotate-90" aria-hidden />
        {title}
        {meta !== undefined && <span className="ml-auto normal-case tracking-normal">{meta}</span>}
      </summary>
      <div className="flex flex-col gap-4 pt-3">{children}</div>
    </details>
  )
}

const AXIS_LABELS = ['X', 'Y', 'Z'] as const

/**
 * Three numbers on one row (position, rotation, scale…). Drag an axis letter sideways to scrub,
 * or type. Values clamp to [min, max]; double-click a letter resets that axis.
 */
export function VecField({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
}: {
  label: string
  value: readonly [number, number, number]
  min: number
  max: number
  step: number
  defaultValue?: number
  onChange: (v: [number, number, number]) => void
}) {
  const id = useId()
  const decimals = Math.max(0, Math.min(4, -Math.floor(Math.log10(step))))
  const set = (i: number, v: number) => {
    const next = [...value] as [number, number, number]
    next[i] = Math.min(max, Math.max(min, +v.toFixed(decimals)))
    onChange(next)
  }
  const modified = defaultValue !== undefined && value.some((v) => v !== defaultValue)
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {label}
        {modified && <span aria-label="modified" className="size-1 rounded-full bg-foreground" />}
      </span>
      <div role="group" aria-labelledby={id} className="grid grid-cols-3 gap-1.5">
        {AXIS_LABELS.map((a, i) => (
          <label key={a} className="flex h-8 items-center border border-border focus-within:border-foreground">
            <span
              title={`Drag to scrub ${a}${defaultValue !== undefined ? ' · double-click to reset' : ''}`}
              className="flex h-full w-6 shrink-0 cursor-ew-resize touch-none items-center justify-center border-r border-dashed border-border text-[10px] text-muted-foreground select-none"
              onDoubleClick={() => defaultValue !== undefined && set(i, defaultValue)}
              onPointerDown={(e) => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                const startX = e.clientX
                const start = value[i]
                const range = max - min
                const move = (ev: PointerEvent) => set(i, start + ((ev.clientX - startX) / 200) * range * (ev.shiftKey ? 0.1 : 1))
                const up = () => {
                  window.removeEventListener('pointermove', move)
                  window.removeEventListener('pointerup', up)
                }
                window.addEventListener('pointermove', move)
                window.addEventListener('pointerup', up)
              }}
            >
              {a}
            </span>
            <input
              type="number"
              aria-label={`${label} ${a}`}
              value={Number(value[i].toFixed(decimals))}
              min={min}
              max={max}
              step={step}
              onChange={(e) => {
                const n = Number.parseFloat(e.target.value)
                if (Number.isFinite(n)) set(i, n)
              }}
              className="h-full w-full min-w-0 bg-transparent px-1.5 text-right text-xs tabular-nums text-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

/** Several colours on one row: label above each swatch. */
export function SwatchRow({ items, action }: { items: { label: string; value: string; onChange: (v: string) => void }[]; action?: ReactNode }) {
  return (
    <div className="flex items-end gap-3">
      {items.map((it) => (
        <label key={it.label} className="flex min-w-0 flex-col gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{it.label}</span>
          <span className="flex items-center gap-1.5">
            <input type="color" value={it.value} onChange={(e) => it.onChange(e.target.value)} className="size-7 cursor-pointer border border-border bg-transparent p-0" />
            <span className="text-[10px] tabular-nums text-foreground uppercase">{it.value}</span>
          </span>
        </label>
      ))}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

/**
 * Raw JSON for one piece of the document (an object, a layer, the camera, the whole world), kept in
 * sync both ways: it always shows the stored value, and while you type, every edit that parses is
 * applied live (the same validator pieces, links and AI replies go through; callers coalesce the
 * keystrokes into one undo step). Invalid text is never applied. Leaving the box shows the stored
 * value again, so it can't drift from the controls. Esc puts back what was there when you started.
 */
export function JsonEditor<T>({
  label,
  value,
  parse,
  onApply,
  rows = 10,
}: {
  label: string
  value: unknown
  parse: (data: unknown) => T | null
  onApply: (next: T) => void
  rows?: number
}) {
  const id = useId()
  const pretty = JSON.stringify(value, null, 2)
  // Your text while the box is focused and edited; null = show the stored value.
  const [draft, setDraft] = useState<string | null>(null)
  const startRef = useRef<string | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const [error, setError] = useState<string | null>(null)
  // The stored value changed while the box isn't being typed in (undo, a control, an agent's
  // file edit): show it.
  useEffect(() => {
    if (document.activeElement !== areaRef.current) {
      setDraft(null)
      setError(null)
    }
  }, [pretty])
  const edit = (text: string) => {
    setDraft(text)
    try {
      const parsed = parse(JSON.parse(text))
      if (!parsed) return setError('Not valid here — not applied')
      setError(null)
      onApply(parsed)
    } catch (e) {
      setError(`${(e as Error).message} — not applied`)
    }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <textarea
        ref={areaRef}
        id={id}
        spellCheck={false}
        rows={rows}
        value={draft ?? pretty}
        onFocus={() => (startRef.current = pretty)}
        onBlur={() => {
          setDraft(null)
          setError(null)
        }}
        onChange={(e) => edit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && draft !== null && startRef.current !== null) {
            e.preventDefault()
            edit(startRef.current)
            setDraft(null)
          }
        }}
        className={cn(
          'w-full resize-y border bg-background p-2 font-mono text-[11px] leading-relaxed text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2',
          error ? 'border-destructive' : 'border-border',
        )}
      />
      <p role="status" className={cn('text-[11px]', error ? 'text-destructive' : 'text-muted-foreground')}>
        {error ?? (draft !== null ? 'Live — changes apply as you type · Esc undoes this edit' : 'Live — mirrors the controls; edits apply as you type')}
      </p>
    </div>
  )
}

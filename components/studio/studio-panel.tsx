'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeftRight, ArrowUpDown, Box, Image as ImageIcon, Sparkles, Type, Upload } from 'lucide-react'
import {
  CHARSETS,
  FONT_OPTIONS,
  LOOKS,
  DEFAULT_CONFIG,
  diffFromDefaults,
  sanitizeConfig,
  type AsciiConfig,
  type ColorMode,
  type MaskMode,
  type MotionMode,
  type ShadeMode,
  type ShapeMode,
} from '@/lib/ascii/config'
import { getSourcePresets } from '@/lib/ascii/presets'
import { ChipRow, ColorField, Disclosure, JsonEditor, Section, Segmented, SelectField, SliderField, SwatchRow, TextField, ToggleField, VecField } from './controls'
import { cn } from '@/lib/utils'
import { STUDIO_DEFAULTS } from './share'
import type { SourceState } from './types'

interface StudioPanelProps {
  cfg: AsciiConfig
  onChange: (patch: Partial<AsciiConfig>) => void
  source: SourceState
  onSource: (next: SourceState) => void
  onFile: (file: File) => void
  onUrl: (url: string) => void
  code: string
  onCopyCode: () => void
  onCopyJson: () => void
  onDownloadPng: () => void
  onCopyImage: () => void
  onCopyText: () => void
  onRecord: () => void
  recording: boolean
  onShare: () => void
  onCopyTerminal: () => void
  copied: string | null
  /** Rendered as the "Model" section while the scene source is active. */
  modelPanel?: ReactNode
  /** Rendered as the "World" section while the world source is active. */
  worldPanel?: ReactNode
  /** Rendered as the "Generate with AI" section. */
  aiPanel?: ReactNode
  /** Rendered as the "Folder" section when the browser can hold a folder. */
  folderPanel?: ReactNode
}

const fontOptions = FONT_OPTIONS.map((f) => ({ value: f.key, label: f.label }))
const deg = (v: number) => `${Math.round(v)}°`
const pct = (v: number) => `${Math.round(v * 100)}%`

type Mode = 'image' | 'text' | 'scene' | 'world'
const MODES: { value: Mode; label: string; icon: typeof Box; hint: string }[] = [
  { value: 'image', label: 'Image', icon: ImageIcon, hint: 'A built-in mark, an upload or an image URL' },
  { value: 'text', label: 'Text', icon: Type, hint: 'Any words, in a monospace face' },
  { value: 'scene', label: 'Model', icon: Box, hint: 'Model, sculpt & paint in 3D' },
  { value: 'world', label: 'Scene', icon: Sparkles, hint: 'Compose an animated 2D / 3D scene' },
]
const modeOf = (s: SourceState): Mode => (s.kind === 'preset' || s.kind === 'upload' ? 'image' : s.kind)

const QUIET_BUTTON =
  'inline-flex items-center gap-1 text-[11px] tracking-widest text-muted-foreground uppercase hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed'
const BUTTON =
  'flex h-9 items-center justify-center gap-1.5 border border-border px-3 text-[11px] tracking-widest uppercase transition-colors hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60'

export function StudioPanel({
  cfg,
  onChange,
  source,
  onSource,
  onFile,
  onUrl,
  code,
  onCopyCode,
  onCopyJson,
  onDownloadPng,
  onCopyImage,
  onCopyText,
  onRecord,
  recording,
  onShare,
  onCopyTerminal,
  copied,
  modelPanel,
  worldPanel,
  aiPanel,
  folderPanel,
}: StudioPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const presets = getSourcePresets()
  const activeCharset = CHARSETS.find((c) => c.value === cfg.charset)?.key ?? null
  const mode = modeOf(source)
  // Switching modes and back keeps what you had: the last mark / upload and the last text.
  const lastImage = useRef<SourceState>({ kind: 'preset', key: presets[0].key })
  const lastText = useRef<SourceState>({ kind: 'text', text: 'ASCII', fontKey: 'geist-mono', weight: 800 })
  if (mode === 'image') lastImage.current = source
  if (mode === 'text') lastText.current = source
  const pickMode = (next: Mode) => {
    if (next === mode) return
    onSource(next === 'image' ? lastImage.current : next === 'text' ? lastText.current : { kind: next })
  }
  const isImageLike = mode === 'image' || mode === 'text'
  const look = LOOKS.find((l) => Object.entries(l.patch).every(([k, v]) => cfg[k as keyof AsciiConfig] === v))?.key ?? null

  return (
    <div className="flex flex-col">
      {/* What to render: one mode at a time; its controls follow. */}
      <div className="sticky top-0 z-10 border-b border-dashed border-border bg-background px-5 py-3">
        <div
          role="tablist"
          aria-label="Source"
          className="grid grid-cols-4 border border-border"
          onKeyDown={(e) => {
            const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
            if (!dir) return
            e.preventDefault()
            const i = (MODES.findIndex((m) => m.value === mode) + dir + MODES.length) % MODES.length
            pickMode(MODES[i].value)
            ;(e.currentTarget.children[i] as HTMLElement | undefined)?.focus()
          }}
        >
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="tab"
              aria-selected={mode === m.value}
              tabIndex={mode === m.value ? 0 : -1}
              title={m.hint}
              onClick={() => pickMode(m.value)}
              className={cn(
                'flex h-9 items-center justify-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:-outline-offset-4',
                mode === m.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <m.icon className="size-3.5 max-[380px]:hidden" aria-hidden />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {aiPanel && (
        <Section title="Generate with AI" defaultOpen>
          {aiPanel}
        </Section>
      )}

      {mode === 'image' && (
        <Section title="Image" defaultOpen>
          <ChipRow
            label="Built-in marks"
            value={source.kind === 'preset' ? source.key : null}
            options={presets.map((p) => ({ value: p.key, label: p.label }))}
            onChange={(key) => onSource({ kind: 'preset', key })}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.svg"
            className="sr-only"
            tabIndex={-1}
            aria-label="Upload an image, SVG or logo"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFile(file)
              e.target.value = ''
            }}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Your own</span>
            <form
              className="flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                if (urlDraft.trim()) onUrl(urlDraft.trim())
              }}
            >
              <button type="button" onClick={() => fileRef.current?.click()} className={cn(BUTTON, 'shrink-0', source.kind === 'upload' && 'border-foreground')} title="Upload an image, SVG or logo (u)">
                <Upload className="size-3.5" aria-hidden />
                Upload
              </button>
              <input
                type="url"
                aria-label="Image URL"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="or paste an image URL"
                className="h-9 min-w-0 flex-1 border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2"
              />
              {urlDraft.trim() && (
                <button type="submit" className={BUTTON}>
                  Load
                </button>
              )}
            </form>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {source.kind === 'upload' ? <span className="text-foreground">{source.name} · </span> : null}
              Drop or paste onto the canvas too. Logos extrude; photos become reliefs.
            </p>
          </div>
        </Section>
      )}

      {mode === 'text' && source.kind === 'text' && (
        <Section title="Text" defaultOpen>
          <TextField label="Text" multiline value={source.text} onChange={(text) => onSource({ ...source, text })} />
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <SelectField label="Typeface" value={source.fontKey} options={fontOptions} onChange={(fontKey) => onSource({ ...source, fontKey })} />
            <SelectField
              label="Weight"
              value={String(source.weight)}
              options={[300, 400, 500, 600, 700, 800, 900].map((w) => ({ value: String(w), label: String(w) }))}
              onChange={(w) => onSource({ ...source, weight: Number(w) })}
            />
          </div>
        </Section>
      )}

      {mode === 'scene' && modelPanel && (
        <Section title="Model" defaultOpen>
          {modelPanel}
        </Section>
      )}

      {mode === 'world' && worldPanel && (
        <Section title="Scene" defaultOpen>
          {worldPanel}
        </Section>
      )}

      <Section title="Look" defaultOpen>
        <ChipRow
          label="Preset"
          value={look}
          options={LOOKS.map((l) => ({ value: l.key, label: l.label }))}
          onChange={(key) => {
            const l = LOOKS.find((x) => x.key === key)
            if (l) onChange(l.patch)
          }}
        />
        <ChipRow
          label="Characters"
          value={activeCharset}
          options={CHARSETS.map((c) => ({ value: c.key, label: c.label }))}
          onChange={(key) => {
            const set = CHARSETS.find((c) => c.key === key)
            if (set) onChange({ charset: set.value })
          }}
        />
        <div className="flex items-end gap-1.5">
          <div className="min-w-0 flex-1">
            <TextField label="Custom ramp (dark → bright)" value={cfg.charset} onChange={(charset) => onChange({ charset })} placeholder=" .:-=+*#%@" />
          </div>
          <button type="button" title="Reverse the ramp" aria-label="Reverse ramp" onClick={() => onChange({ charset: Array.from(cfg.charset).reverse().join('') })} className={cn(BUTTON, 'px-2.5')}>
            <ArrowLeftRight className="size-3.5" aria-hidden />
          </button>
        </div>
        <SliderField label="Cell size" value={cfg.cellSize} min={4} max={24} step={1} onChange={(cellSize) => onChange({ cellSize })} defaultValue={DEFAULT_CONFIG.cellSize} format={(v) => `${v}px`} />
        {mode === 'world' ? (
          <SwatchRow items={[{ label: 'Background', value: cfg.bg, onChange: (bg) => onChange({ bg }) }]} action={<span className="text-[11px] text-muted-foreground">Object colours: Scene → object → Material</span>} />
        ) : (
          <>
        <Segmented<ColorMode>
          label="Colour"
          value={cfg.colorMode}
          options={[
            { value: 'mono', label: 'Mono' },
            { value: 'gradient', label: 'Tone' },
            { value: 'depth', label: 'Depth' },
            { value: 'source', label: 'Image' },
          ]}
          onChange={(colorMode) => onChange({ colorMode })}
        />
        <SwatchRow
          items={[
            { label: cfg.colorMode === 'mono' ? 'Glyphs' : 'Bright', value: cfg.fg, onChange: (fg) => onChange({ fg }) },
            ...(cfg.colorMode === 'gradient' || cfg.colorMode === 'depth' ? [{ label: 'Dark', value: cfg.fg2, onChange: (fg2: string) => onChange({ fg2 }) }] : []),
            { label: 'Background', value: cfg.bg, onChange: (bg) => onChange({ bg }) },
          ]}
          action={
            (cfg.colorMode === 'gradient' || cfg.colorMode === 'depth') && (
              <button type="button" title="Swap bright and dark" aria-label="Swap colours" onClick={() => onChange({ fg: cfg.fg2, fg2: cfg.fg })} className={cn(BUTTON, 'h-7 px-2')}>
                <ArrowUpDown className="size-3.5" aria-hidden />
              </button>
            )
          }
        />
          </>
        )}
        <Disclosure title="More type & background">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <SelectField label="Typeface" value={cfg.fontKey} options={fontOptions} onChange={(fontKey) => onChange({ fontKey })} />
            <SelectField
              label="Weight"
              value={String(cfg.fontWeight)}
              options={[300, 400, 500, 600, 700, 800].map((w) => ({ value: String(w), label: String(w) }))}
              onChange={(w) => onChange({ fontWeight: Number(w) })}
            />
          </div>
          <SliderField label="Cell aspect" value={cfg.cellAspect} min={0.6} max={2.4} step={0.05} onChange={(cellAspect) => onChange({ cellAspect })} defaultValue={DEFAULT_CONFIG.cellAspect} format={(v) => v.toFixed(2)} />
          <SliderField label="Glyph scale" value={cfg.glyphScale} min={0.5} max={1.8} step={0.05} onChange={(glyphScale) => onChange({ glyphScale })} defaultValue={DEFAULT_CONFIG.glyphScale} format={(v) => v.toFixed(2)} />
          <ToggleField label="Transparent background" value={cfg.transparentBg} onChange={(transparentBg) => onChange({ transparentBg })} />
          <ToggleField label="Dotted grid behind" value={cfg.gridDots} onChange={(gridDots) => onChange({ gridDots })} />
          {cfg.gridDots && (
            <>
              <div className="flex items-end gap-3">
                <div className="w-20">
                  <TextField label="Grid glyph" value={cfg.gridChar} onChange={(gridChar) => onChange({ gridChar: Array.from(gridChar)[0] ?? '' })} />
                </div>
                <div className="flex-1">
                  <ColorField label="Grid colour" value={cfg.gridColor} onChange={(gridColor) => onChange({ gridColor })} />
                </div>
              </div>
              <SliderField label="Grid opacity" value={cfg.gridOpacity} min={0.01} max={0.6} step={0.01} onChange={(gridOpacity) => onChange({ gridOpacity })} defaultValue={DEFAULT_CONFIG.gridOpacity} format={pct} />
            </>
          )}
        </Disclosure>
      </Section>

      {isImageLike && (
        <Section title="Shape">
          <Segmented<ShapeMode>
            label="3D mode"
            value={cfg.shape}
            options={[
              { value: 'extrude', label: 'Extrude' },
              { value: 'relief', label: 'Relief' },
            ]}
            onChange={(shape) => onChange({ shape })}
          />
          {cfg.shape === 'extrude' ? (
            <SliderField label="Thickness" value={cfg.thickness} min={0} max={0.8} step={0.01} onChange={(thickness) => onChange({ thickness })} defaultValue={DEFAULT_CONFIG.thickness} />
          ) : (
            <SliderField label="Relief depth" value={cfg.reliefDepth} min={0} max={1} step={0.01} onChange={(reliefDepth) => onChange({ reliefDepth })} defaultValue={DEFAULT_CONFIG.reliefDepth} />
          )}
          <Disclosure title="Silhouette">
            <SelectField<MaskMode>
              label="Cut out from"
              value={cfg.maskMode}
              options={[
                { value: 'auto', label: 'Auto detect' },
                { value: 'alpha', label: 'Transparency' },
                { value: 'luma', label: 'Light pixels' },
                { value: 'luma-invert', label: 'Dark pixels' },
                { value: 'none', label: 'Whole image' },
              ]}
              onChange={(maskMode) => onChange({ maskMode })}
            />
            <SliderField label="Threshold" value={cfg.threshold} min={0.02} max={0.98} step={0.01} onChange={(threshold) => onChange({ threshold })} defaultValue={DEFAULT_CONFIG.threshold} format={pct} />
            <SliderField label="Edge smoothing" value={cfg.smooth} min={0} max={4} step={1} onChange={(smooth) => onChange({ smooth })} defaultValue={DEFAULT_CONFIG.smooth} />
            <ToggleField label="Invert silhouette" value={cfg.invertMask} onChange={(invertMask) => onChange({ invertMask })} />
          </Disclosure>
        </Section>
      )}

      <Section title="Light">
        {mode !== 'world' && (
          <Segmented<ShadeMode>
            label="Brightness from"
            value={cfg.shade}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'image', label: 'Image' },
              { value: 'both', label: 'Both' },
            ]}
            onChange={(shade) => onChange({ shade })}
          />
        )}
        <SliderField label="Light direction" value={cfg.lightAzimuth} min={-180} max={180} step={1} onChange={(lightAzimuth) => onChange({ lightAzimuth })} defaultValue={DEFAULT_CONFIG.lightAzimuth} format={deg} />
        <SliderField label="Light height" value={cfg.lightElevation} min={-90} max={90} step={1} onChange={(lightElevation) => onChange({ lightElevation })} defaultValue={DEFAULT_CONFIG.lightElevation} format={deg} />
        <SliderField label="Contrast" value={cfg.contrast} min={0.3} max={3} step={0.05} onChange={(contrast) => onChange({ contrast })} defaultValue={DEFAULT_CONFIG.contrast} format={(v) => v.toFixed(2)} />
        <Disclosure title="More tone">
          <SliderField label="Ambient" value={cfg.ambient} min={0} max={1} step={0.01} onChange={(ambient) => onChange({ ambient })} defaultValue={DEFAULT_CONFIG.ambient} format={pct} />
          <SliderField label="Brightness" value={cfg.brightness} min={-0.5} max={0.5} step={0.01} onChange={(brightness) => onChange({ brightness })} defaultValue={DEFAULT_CONFIG.brightness} />
          <SliderField label="Gamma" value={cfg.gamma} min={0.3} max={3} step={0.05} onChange={(gamma) => onChange({ gamma })} defaultValue={DEFAULT_CONFIG.gamma} format={(v) => v.toFixed(2)} />
          <SliderField label="Depth fade" value={cfg.depthFade} min={0} max={1} step={0.01} onChange={(depthFade) => onChange({ depthFade })} defaultValue={DEFAULT_CONFIG.depthFade} format={pct} />
          <ToggleField label="Light follows cursor" value={cfg.pointerLight} onChange={(pointerLight) => onChange({ pointerLight })} />
          <ToggleField label="Invert tones" value={cfg.invert} onChange={(invert) => onChange({ invert })} />
        </Disclosure>
      </Section>

      {mode !== 'world' && (
        <Section title="Motion & view">
          <Segmented<MotionMode>
            label="Animation"
            value={cfg.motion}
            options={[
              { value: 'static', label: 'Still' },
              { value: 'spin', label: 'Spin' },
              { value: 'sway', label: 'Sway' },
            ]}
            onChange={(motion) => onChange({ motion })}
          />
          {cfg.motion === 'spin' && (
            <VecField label="Spin (°/s)" value={[cfg.spinX, cfg.spinY, cfg.spinZ]} min={-180} max={180} step={1} defaultValue={0} onChange={([spinX, spinY, spinZ]) => onChange({ spinX, spinY, spinZ })} />
          )}
          {cfg.motion === 'sway' && (
            <>
              <SliderField label="Sway left / right" value={cfg.swayY} min={0} max={90} step={1} onChange={(swayY) => onChange({ swayY })} defaultValue={DEFAULT_CONFIG.swayY} format={deg} />
              <SliderField label="Sway up / down" value={cfg.swayX} min={0} max={90} step={1} onChange={(swayX) => onChange({ swayX })} defaultValue={DEFAULT_CONFIG.swayX} format={deg} />
              <SliderField label="Sway speed" value={cfg.swaySpeed} min={0.1} max={4} step={0.05} onChange={(swaySpeed) => onChange({ swaySpeed })} defaultValue={DEFAULT_CONFIG.swaySpeed} format={(v) => v.toFixed(2)} />
            </>
          )}
          <SliderField label="Zoom" value={cfg.zoom} min={0.3} max={2} step={0.01} onChange={(zoom) => onChange({ zoom })} defaultValue={DEFAULT_CONFIG.zoom} format={(v) => `${v.toFixed(2)}×`} />
          <Disclosure title="Camera & interaction">
            <VecField label="Base rotation (°)" value={[cfg.rotX, cfg.rotY, cfg.rotZ]} min={-180} max={180} step={1} onChange={([rotX, rotY, rotZ]) => onChange({ rotX, rotY, rotZ })} />
            <SliderField label="Perspective" value={cfg.perspective} min={0} max={1.1} step={0.01} onChange={(perspective) => onChange({ perspective })} defaultValue={DEFAULT_CONFIG.perspective} format={pct} />
            <SliderField label="Offset X" value={cfg.offsetX} min={-0.5} max={0.5} step={0.01} onChange={(offsetX) => onChange({ offsetX })} defaultValue={DEFAULT_CONFIG.offsetX} format={pct} />
            <SliderField label="Offset Y" value={cfg.offsetY} min={-0.5} max={0.5} step={0.01} onChange={(offsetY) => onChange({ offsetY })} defaultValue={DEFAULT_CONFIG.offsetY} format={pct} />
            <ToggleField label="Drag to rotate (360°)" value={cfg.interactive} onChange={(interactive) => onChange({ interactive })} />
            {cfg.interactive && <SliderField label="Drag glide" value={cfg.inertia} min={0.01} max={0.6} step={0.01} onChange={(inertia) => onChange({ inertia })} defaultValue={DEFAULT_CONFIG.inertia} format={(v) => v.toFixed(2)} />}
            <ToggleField label="Scroll to zoom" value={cfg.wheelZoom} onChange={(wheelZoom) => onChange({ wheelZoom })} />
          </Disclosure>
        </Section>
      )}

      {mode === 'world' && (
        <Section title="View & interaction">
          <SliderField label="Zoom" value={cfg.zoom} min={0.3} max={2} step={0.01} onChange={(zoom) => onChange({ zoom })} defaultValue={DEFAULT_CONFIG.zoom} format={(v) => `${v.toFixed(2)}×`} />
          <SliderField label="Offset X" value={cfg.offsetX} min={-0.5} max={0.5} step={0.01} onChange={(offsetX) => onChange({ offsetX })} defaultValue={DEFAULT_CONFIG.offsetX} format={pct} />
          <SliderField label="Offset Y" value={cfg.offsetY} min={-0.5} max={0.5} step={0.01} onChange={(offsetY) => onChange({ offsetY })} defaultValue={DEFAULT_CONFIG.offsetY} format={pct} />
          <ToggleField label="Drag to orbit" value={cfg.interactive} onChange={(interactive) => onChange({ interactive })} />
          {cfg.interactive && <SliderField label="Drag glide" value={cfg.inertia} min={0.01} max={0.6} step={0.01} onChange={(inertia) => onChange({ inertia })} defaultValue={DEFAULT_CONFIG.inertia} format={(v) => v.toFixed(2)} />}
          <ToggleField label="Scroll to zoom" value={cfg.wheelZoom} onChange={(wheelZoom) => onChange({ wheelZoom })} />
          <p className="text-[11px] leading-relaxed text-muted-foreground">Camera angle, perspective and camera motion live in Scene → Camera &amp; loop.</p>
        </Section>
      )}

      <Section title="Effects">
        <SliderField label="Intro dissolve" value={cfg.intro} min={0} max={4} step={0.1} onChange={(intro) => onChange({ intro })} defaultValue={DEFAULT_CONFIG.intro} format={(v) => (v === 0 ? 'off' : `${v.toFixed(1)}s`)} />
        <SliderField label="Glyph shimmer" value={cfg.shimmer} min={0} max={0.6} step={0.01} onChange={(shimmer) => onChange({ shimmer })} defaultValue={DEFAULT_CONFIG.shimmer} format={pct} />
        {mode !== 'world' && <SliderField label="Wave" value={cfg.waveAmp} min={0} max={0.3} step={0.005} onChange={(waveAmp) => onChange({ waveAmp })} defaultValue={DEFAULT_CONFIG.waveAmp} format={(v) => (v === 0 ? 'off' : v.toFixed(3))} />}
        {mode !== 'world' && cfg.waveAmp > 0 && (
          <>
            <SliderField label="Wave frequency" value={cfg.waveFreq} min={1} max={30} step={0.5} onChange={(waveFreq) => onChange({ waveFreq })} defaultValue={DEFAULT_CONFIG.waveFreq} />
            <SliderField label="Wave speed" value={cfg.waveSpeed} min={0} max={8} step={0.1} onChange={(waveSpeed) => onChange({ waveSpeed })} defaultValue={DEFAULT_CONFIG.waveSpeed} />
          </>
        )}
        <SliderField label="Scanline glow" value={cfg.scanStrength} min={0} max={1} step={0.01} onChange={(scanStrength) => onChange({ scanStrength })} defaultValue={DEFAULT_CONFIG.scanStrength} format={(v) => (v === 0 ? 'off' : pct(v))} />
        {cfg.scanStrength > 0 && (
          <SliderField label="Scanline speed" value={cfg.scanSpeed} min={0.05} max={1.5} step={0.01} onChange={(scanSpeed) => onChange({ scanSpeed })} defaultValue={DEFAULT_CONFIG.scanSpeed} format={(v) => v.toFixed(2)} />
        )}
      </Section>

      <Section title="Export" defaultOpen>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={onShare} className={BUTTON} title="Copy a link to this piece (s)">
            {copied === 'share' ? 'Copied' : 'Share link'}
          </button>
          <button type="button" onClick={onCopyCode} className={BUTTON} title="Copy React component code (c)">
            {copied === 'code' ? 'Copied' : 'React code'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: 'png', label: 'PNG', action: onDownloadPng, title: 'Download the frame as PNG' },
            { key: 'video', label: recording ? 'Recording…' : 'Video', action: onRecord, disabled: recording, title: 'Record a WebM (worlds: one loop)' },
            { key: 'image', label: copied === 'image' ? 'Copied' : 'Copy PNG', action: onCopyImage, title: 'Copy the frame as an image' },
            { key: 'text', label: copied === 'text' ? 'Copied' : 'Copy text', action: onCopyText, title: 'Copy the frame as plain-text ASCII (t)' },
            { key: 'json', label: copied === 'json' ? 'Copied' : 'Config', action: onCopyJson, title: 'Copy the changed config keys as JSON' },
            { key: 'terminal', label: copied === 'terminal' ? 'Copied' : 'Terminal', action: onCopyTerminal, title: 'Copy a command that plays this in a terminal' },
          ].map((b) => (
            <button key={b.key} type="button" title={b.title} onClick={b.action} disabled={b.disabled} className={cn(BUTTON, 'px-1')}>
              {b.label}
            </button>
          ))}
        </div>
        <Disclosure title="Settings JSON">
          <JsonEditor
            label="Look, light, motion and effects — keys that differ from the defaults"
            rows={10}
            value={{ ...diffFromDefaults(cfg), motion: cfg.motion }}
            parse={(d) => (d && typeof d === 'object' ? { ...STUDIO_DEFAULTS, ...sanitizeConfig(d) } : null)}
            onApply={(next) => onChange(next)}
          />
        </Disclosure>
        <Disclosure title="Show code">
          <label className="sr-only" htmlFor="export-code">
            Generated component code
          </label>
          <textarea
            id="export-code"
            readOnly
            value={code}
            rows={12}
            className="w-full resize-y border border-border bg-background p-2 text-[11px] leading-relaxed text-muted-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Install with <code className="text-foreground">npx shadcn add …/r/ohmyascii.json</code>, or copy <code className="text-foreground">components/ohmyascii.tsx</code> and{' '}
            <code className="text-foreground">lib/ascii/</code>.
          </p>
        </Disclosure>
      </Section>

      {folderPanel && <Section title="Folder (agents)">{folderPanel}</Section>}
    </div>
  )
}

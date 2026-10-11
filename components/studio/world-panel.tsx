'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Copy, Eye, EyeOff, Trash2, X } from 'lucide-react'
import { FONT_OPTIONS, type FontKey } from '@/lib/ascii/config'
import { newId, serializeScene, type Vec3 } from '@/lib/ascii/scene'
import {
  BEHAVIOUR_TYPES,
  CURVE_TYPES,
  FIELD_TYPES,
  FLAT_TYPES,
  PARTICLE_TYPES,
  SOLID_TYPES,
  TERRAIN_TYPES,
  defaultBehaviour,
  defaultField,
  defaultGeom,
  emptyWorld,
  makeObject,
  objectLabel,
  parseBehaviour,
  parseField,
  parseObject,
  parseWorld,
  serializeWorld,
  type ArraySpec,
  type Axis,
  type Behaviour,
  type BehaviourType,
  type Field,
  type FieldType,
  type Geom,
  type GeomKind,
  type Keyframe,
  type World,
  type WObject,
} from '@/lib/ascii/world'
import { WORLD_PRESETS } from '@/lib/ascii/worlds'
import { cn } from '@/lib/utils'
import { ColorField, Disclosure, JsonEditor, Segmented, SelectField, SliderField, SwatchRow, TextField, ToggleField, VecField } from './controls'

const BUTTON =
  'h-8 border border-border px-2 text-[11px] tracking-widest uppercase transition-colors hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50'
const AXIS_OPTS: { value: Axis; label: string }[] = [
  { value: 'x', label: 'X' },
  { value: 'y', label: 'Y' },
  { value: 'z', label: 'Z' },
]
const opts = <T extends string>(xs: readonly T[]) => xs.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))
const deg = (v: number) => `${Math.round(v)}°`

const ADD_KINDS: { kind: GeomKind; label: string }[] = [
  { kind: 'shape', label: 'Solid' },
  { kind: 'flat', label: '2D shape' },
  { kind: 'text', label: 'Text' },
  { kind: 'curve', label: 'Curve' },
  { kind: 'terrain', label: 'Terrain' },
  { kind: 'particles', label: 'Particles' },
]

const BEHAVIOUR_LABELS: Record<BehaviourType, string> = {
  spin: 'Spin',
  orbit: 'Orbit',
  bob: 'Bob',
  pulse: 'Pulse',
  sway: 'Sway',
  drift: 'Drift',
  keys: 'Keyframes',
  wave: 'Wave (deform)',
  twist: 'Twist (deform)',
}

function Group({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-dashed border-border pt-3">
      <div className="flex items-center justify-between text-[11px] tracking-widest text-muted-foreground uppercase">
        <span>{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

function VecSliders({ label, value, min, max, step, def, onChange }: { label: string; value: Vec3; min: number; max: number; step: number; def: number; format?: (v: number) => string; onChange: (v: Vec3) => void }) {
  return <VecField label={label} value={value} min={min} max={max} step={step} defaultValue={def} onChange={onChange} />
}

// ---------- behaviours ----------

function BehaviourEditor({ b, onChange }: { b: Behaviour; onChange: (b: Behaviour) => void }) {
  const set = (patch: Record<string, unknown>) => onChange({ ...b, ...patch } as Behaviour)
  switch (b.type) {
    case 'spin':
      return (
        <>
          <Segmented label="Axis" value={b.axis} options={AXIS_OPTS} onChange={(axis) => set({ axis })} />
          <SliderField label="Speed (°/s)" value={b.speed} min={-360} max={360} step={1} defaultValue={30} onChange={(speed) => set({ speed })} />
        </>
      )
    case 'orbit':
      return (
        <>
          <Segmented label="Plane" value={b.plane} options={[{ value: 'xz', label: 'Ground (XZ)' }, { value: 'xy', label: 'Screen (XY)' }]} onChange={(plane) => set({ plane })} />
          <SliderField label="Radius" value={b.radius} min={0} max={3} step={0.01} defaultValue={0.6} onChange={(radius) => set({ radius })} />
          <SliderField label="Speed (°/s)" value={b.speed} min={-360} max={360} step={1} defaultValue={30} onChange={(speed) => set({ speed })} />
          <SliderField label="Tilt" value={b.tilt} min={-90} max={90} step={1} defaultValue={0} format={deg} onChange={(tilt) => set({ tilt })} />
          <SliderField label="Start angle" value={b.phase} min={0} max={360} step={1} defaultValue={0} format={deg} onChange={(phase) => set({ phase })} />
        </>
      )
    case 'bob':
    case 'sway':
      return (
        <>
          <Segmented label="Axis" value={b.axis} options={AXIS_OPTS} onChange={(axis) => set({ axis })} />
          <SliderField label={b.type === 'sway' ? 'Angle' : 'Distance'} value={b.amp} min={0} max={b.type === 'sway' ? 90 : 1} step={b.type === 'sway' ? 1 : 0.005} onChange={(amp) => set({ amp })} />
          <SliderField label="Speed (cycles/s)" value={b.speed} min={0} max={3} step={0.01} onChange={(speed) => set({ speed })} />
          <SliderField label="Phase" value={b.phase} min={0} max={1} step={0.01} defaultValue={0} onChange={(phase) => set({ phase })} />
        </>
      )
    case 'pulse':
      return (
        <>
          <SliderField label="Amount" value={b.amp} min={-0.9} max={2} step={0.01} defaultValue={0.08} onChange={(amp) => set({ amp })} />
          <SliderField label="Speed (cycles/s)" value={b.speed} min={0} max={3} step={0.01} defaultValue={0.5} onChange={(speed) => set({ speed })} />
          <SliderField label="Phase" value={b.phase} min={0} max={1} step={0.01} defaultValue={0} onChange={(phase) => set({ phase })} />
        </>
      )
    case 'drift':
      return (
        <>
          <VecSliders label="Velocity" value={b.vel} min={-2} max={2} step={0.01} def={0} onChange={(vel) => set({ vel })} />
          <SliderField label="Wrap distance" value={b.wrap} min={0} max={8} step={0.05} defaultValue={1.5} onChange={(wrap) => set({ wrap })} />
        </>
      )
    case 'keys':
      return (
        <>
          <SliderField label="Loop (s)" value={b.loop} min={0} max={60} step={0.1} onChange={(loop) => set({ loop })} />
          <Segmented label="Easing" value={b.ease} options={[{ value: 'smooth', label: 'Smooth' }, { value: 'linear', label: 'Linear' }]} onChange={(ease) => set({ ease })} />
          <KeyframeEditor keys={b.keys} onChange={(keys) => set({ keys })} />
        </>
      )
    case 'wave':
      return (
        <>
          <Segmented label="Displace" value={b.axis} options={AXIS_OPTS} onChange={(axis) => set({ axis })} />
          <SliderField label="Amount" value={b.amp} min={0} max={0.5} step={0.005} onChange={(amp) => set({ amp })} />
          <SliderField label="Frequency" value={b.freq} min={0} max={30} step={0.1} onChange={(freq) => set({ freq })} />
          <SliderField label="Speed (cycles/s)" value={b.speed} min={-3} max={3} step={0.01} onChange={(speed) => set({ speed })} />
        </>
      )
    case 'twist':
      return (
        <>
          <SliderField label="Amount (°/unit)" value={b.amount} min={-360} max={360} step={1} onChange={(amount) => set({ amount })} />
          <SliderField label="Speed (cycles/s, 0 = fixed)" value={b.speed} min={0} max={3} step={0.01} onChange={(speed) => set({ speed })} />
        </>
      )
  }
}

const KEY_CHANNELS = [
  { key: 'pos', label: 'Move' },
  { key: 'rot', label: 'Turn' },
  { key: 'scale', label: 'Scale' },
] as const

/** Keyframes: time + optional move / turn / scale offsets. A channel left off a key is skipped there. */
function KeyframeEditor({ keys, onChange }: { keys: Keyframe[]; onChange: (keys: Keyframe[]) => void }) {
  const setKey = (i: number, k: Keyframe) => onChange(keys.map((x, j) => (j === i ? k : x)).sort((a, c) => a.t - c.t))
  return (
    <div className="flex flex-col gap-2">
      {keys.map((k, i) => (
        <div key={i} className="flex flex-col gap-3 border border-dashed border-border p-2">
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 text-muted-foreground">
              At
              <input
                type="number"
                aria-label={`Key ${i + 1} time (s)`}
                value={k.t}
                min={0}
                step={0.1}
                onChange={(e) => Number.isFinite(e.target.valueAsNumber) && setKey(i, { ...k, t: Math.max(0, e.target.valueAsNumber) })}
                className="h-7 w-16 border border-border bg-background px-1.5 text-right tabular-nums text-foreground"
              />
              s
            </label>
            <div className="ml-auto flex gap-1">
              {KEY_CHANNELS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={k[c.key] !== undefined}
                  title={`${k[c.key] !== undefined ? 'Remove' : 'Add'} ${c.label.toLowerCase()} on this key`}
                  onClick={() => {
                    const next: Keyframe = { ...k }
                    if (k[c.key] !== undefined) delete next[c.key]
                    else if (c.key === 'scale') next.scale = 1
                    else next[c.key] = [0, 0, 0]
                    setKey(i, next)
                  }}
                  className={cn('h-6 border px-1.5 text-[10px] tracking-widest uppercase', k[c.key] !== undefined ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground')}
                >
                  {c.label}
                </button>
              ))}
              <button type="button" aria-label={`Remove key ${i + 1}`} className="px-1 text-muted-foreground hover:text-foreground" onClick={() => onChange(keys.filter((_, j) => j !== i))}>
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
          {k.pos && <VecField label="Move" value={k.pos} min={-5} max={5} step={0.01} defaultValue={0} onChange={(pos) => setKey(i, { ...k, pos })} />}
          {k.rot && <VecField label="Turn (°)" value={k.rot} min={-720} max={720} step={1} defaultValue={0} onChange={(rot) => setKey(i, { ...k, rot })} />}
          {k.scale !== undefined && <SliderField label="Scale" value={k.scale} min={0} max={4} step={0.01} defaultValue={1} onChange={(scale) => setKey(i, { ...k, scale })} />}
        </div>
      ))}
      <button
        type="button"
        className={BUTTON}
        onClick={() => {
          const last = keys[keys.length - 1]
          onChange([...keys, { t: last ? +(last.t + 1).toFixed(2) : 0, pos: last?.pos ? [...last.pos] : [0, 0, 0] }])
        }}
      >
        + Key
      </button>
    </div>
  )
}

function BehaviourList({ anim, onChange, label = 'Animation' }: { anim: Behaviour[]; onChange: (anim: Behaviour[]) => void; label?: string }) {
  return (
    <Disclosure title={label} meta={anim.length ? anim.map((b) => BEHAVIOUR_LABELS[b.type].split(' ')[0]).join(' · ') : 'still'}>
      <div className="flex justify-end">
        <select
          aria-label="Add animation"
          value=""
          onChange={(e) => e.target.value && onChange([...anim, defaultBehaviour(e.target.value as BehaviourType)])}
          className="h-7 border border-border bg-background px-1 text-[11px] tracking-wide text-foreground normal-case"
        >
          <option value="">+ Add…</option>
          {BEHAVIOUR_TYPES.map((t) => (
            <option key={t} value={t}>
              {BEHAVIOUR_LABELS[t]}
            </option>
          ))}
        </select>
      </div>
      {anim.length === 0 && <p className="text-[11px] text-muted-foreground">Still. Add spin, orbit, bob, pulse, sway, drift, keyframes or a deformer.</p>}
      {anim.map((b, i) => (
        <div key={i} className="flex flex-col gap-3 border-l border-dashed border-foreground/40 pl-3">
          <div className="flex items-center justify-between text-xs">
            <span>{BEHAVIOUR_LABELS[b.type]}</span>
            <button type="button" aria-label={`Remove ${BEHAVIOUR_LABELS[b.type]}`} className="text-muted-foreground hover:text-foreground" onClick={() => onChange(anim.filter((_, j) => j !== i))}>
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
          <BehaviourEditor b={b} onChange={(next) => onChange(anim.map((x, j) => (j === i ? next : x)))} />
        </div>
      ))}
    </Disclosure>
  )
}

// ---------- geometry ----------

function GeomEditor({ geom, onChange, onImage, onEditSculpt }: { geom: Geom; onChange: (g: Geom) => void; onImage: (cb: (url: string) => void) => void; onEditSculpt?: () => void }) {
  const set = (patch: Record<string, unknown>) => onChange({ ...geom, ...patch } as Geom)
  switch (geom.kind) {
    case 'shape':
      return <SelectField label="Solid" value={geom.type} options={opts(SOLID_TYPES)} onChange={(type) => set({ type })} />
    case 'flat':
      return (
        <>
          <SelectField label="2D shape" value={geom.type} options={opts(FLAT_TYPES)} onChange={(type) => set({ type })} />
          {(geom.type === 'polygon' || geom.type === 'star') && <SliderField label={geom.type === 'star' ? 'Points' : 'Sides'} value={geom.sides} min={3} max={64} step={1} onChange={(sides) => set({ sides })} />}
          {['ring', 'star', 'moon', 'petal', 'cross'].includes(geom.type) && <SliderField label={geom.type === 'petal' ? 'Width' : geom.type === 'moon' ? 'Crescent' : 'Inner'} value={geom.inner} min={0.05} max={0.99} step={0.01} onChange={(inner) => set({ inner })} />}
          <SliderField label="Rounding" value={geom.round} min={0} max={0.4} step={0.005} defaultValue={0} onChange={(round) => set({ round })} />
          <SliderField label="Bevel (pillow)" value={geom.bevel} min={0} max={0.5} step={0.005} defaultValue={0.12} onChange={(bevel) => set({ bevel })} />
          <SliderField label="Thickness" value={geom.depth} min={0} max={1} step={0.01} defaultValue={0} format={(v) => (v === 0 ? 'sheet' : v.toFixed(2))} onChange={(depth) => set({ depth })} />
        </>
      )
    case 'text':
      return (
        <>
          <TextField label="Text" value={geom.text} multiline onChange={(text) => set({ text })} />
          <SelectField<FontKey> label="Font" value={geom.fontKey} options={FONT_OPTIONS.map((f) => ({ value: f.key, label: f.label }))} onChange={(fontKey) => set({ fontKey })} />
          <SliderField label="Weight" value={geom.weight} min={100} max={900} step={100} onChange={(weight) => set({ weight })} />
          <SliderField label="Depth" value={geom.depth} min={0} max={1} step={0.01} onChange={(depth) => set({ depth })} />
        </>
      )
    case 'image':
      return (
        <>
          <TextField label="Image URL" value={geom.url} onChange={(url) => set({ url })} />
          <button type="button" className={BUTTON} onClick={() => onImage((url) => set({ url }))}>
            Choose image…
          </button>
          <ToggleField label="Depth relief (photos)" value={geom.relief} onChange={(relief) => set({ relief })} />
          <SliderField label="Depth" value={geom.depth} min={0} max={1} step={0.01} onChange={(depth) => set({ depth })} />
        </>
      )
    case 'curve':
      return (
        <>
          <SelectField label="Curve" value={geom.type} options={opts(CURVE_TYPES)} onChange={(type) => set({ type })} />
          {(geom.type === 'helix' || geom.type === 'spiral') && <SliderField label="Turns" value={geom.turns} min={0.25} max={20} step={0.05} onChange={(turns) => set({ turns })} />}
          {geom.type === 'helix' && <SliderField label="Strands" value={geom.p} min={1} max={6} step={1} onChange={(p) => set({ p })} />}
          {(geom.type === 'knot' || geom.type === 'lissajous') && (
            <>
              <SliderField label="P" value={geom.p} min={1} max={12} step={1} onChange={(p) => set({ p })} />
              <SliderField label="Q" value={geom.q} min={1} max={12} step={1} onChange={(q) => set({ q })} />
            </>
          )}
          <SliderField label="Tube radius" value={geom.tube} min={0.002} max={0.4} step={0.001} onChange={(tube) => set({ tube })} />
        </>
      )
    case 'terrain':
      return (
        <>
          <SelectField label="Terrain" value={geom.type} options={opts(TERRAIN_TYPES)} onChange={(type) => set({ type })} />
          <SliderField label="Height" value={geom.amp} min={0} max={1} step={0.005} onChange={(amp) => set({ amp })} />
          <SliderField label="Detail" value={geom.freq} min={0.2} max={40} step={0.1} onChange={(freq) => set({ freq })} />
          <SliderField label="Flow speed" value={geom.speed} min={-5} max={5} step={0.05} defaultValue={0} onChange={(speed) => set({ speed })} />
          <SliderField label="Seed" value={geom.seed} min={0} max={99} step={1} onChange={(seed) => set({ seed })} />
        </>
      )
    case 'particles':
      return (
        <>
          <SelectField label="Particles" value={geom.type} options={opts(PARTICLE_TYPES)} onChange={(type) => set({ type })} />
          <SliderField label="Count" value={geom.count} min={1} max={20000} step={1} onChange={(count) => set({ count })} />
          <SliderField label="Speed" value={geom.speed} min={-10} max={10} step={0.05} onChange={(speed) => set({ speed })} />
          <SliderField label="Seed" value={geom.seed} min={0} max={99} step={1} onChange={(seed) => set({ seed })} />
        </>
      )
    case 'sculpt':
      return (
        <>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Modelled object — {geom.scene.prims.length} shapes, {geom.scene.dabs.length} sculpt dabs.
          </p>
          {onEditSculpt && (
            <button type="button" className={BUTTON} onClick={onEditSculpt}>
              Edit in the modeller
            </button>
          )}
        </>
      )
  }
}

function ArrayEditor({ array, onChange }: { array: ArraySpec; onChange: (a: ArraySpec) => void }) {
  const set = (patch: Partial<ArraySpec>) => onChange({ ...array, ...patch })
  return (
    <>
      <SliderField label="Copies" value={array.count} min={1} max={240} step={1} onChange={(count) => set({ count })} />
      <VecSliders label="Offset" value={array.offset} min={-3} max={3} step={0.01} def={0} onChange={(offset) => set({ offset })} />
      <VecSliders label="Step move" value={array.step} min={-1.5} max={1.5} step={0.005} def={0} onChange={(step) => set({ step })} />
      <VecSliders label="Step turn" value={array.rot} min={-180} max={180} step={0.25} def={0} format={deg} onChange={(rot) => set({ rot })} />
      <SliderField label="Step grow" value={array.grow} min={0.5} max={1.5} step={0.005} defaultValue={1} onChange={(grow) => set({ grow })} />
      <SliderField label="Whole-array spin (°/s)" value={array.spin} min={-180} max={180} step={0.5} defaultValue={0} onChange={(spin) => set({ spin })} />
      <SliderField label="Stagger (s per copy)" value={array.phase} min={-2} max={2} step={0.01} defaultValue={0} onChange={(phase) => set({ phase })} />
      <SliderField label="Height jitter" value={array.jitter ?? 0} min={0} max={1} step={0.01} defaultValue={0} onChange={(jitter) => set({ jitter })} />
    </>
  )
}

// ---------- panel ----------

export interface WorldPanelProps {
  world: World
  onWorld: (update: (w: World) => World, coalesce?: boolean) => void
  onPreset: (key: string) => void
  activePreset: string | null
  selected: string | null
  onSelect: (id: string | null) => void
  /** The modeller's current scene, offered as an object. */
  onAddModelled: () => void
  onImportFile: (file: File) => void
  onExportJson: () => void
  /** Open a modelled object's scene in the modeller; saving there writes it back to the object. */
  onEditSculpt: (id: string) => void
}

/** One object / field as plain JSON (ids are kept by the panel, not edited). */
const objectJson = (o: WObject) => {
  const { id: _id, ...rest } = serializeWorld({ duration: 1, fit: 1, camera: { rot: [0, 0, 0], zoom: 1, fov: 0, pan: [0, 0], anim: [] }, fields: [], objects: [o] }).objects[0]
  return rest
}
const fieldJson = ({ id: _id, ...rest }: Field) => rest

/**
 * Live JSON edits re-parse modelled objects into new scene objects; keep the old one when its
 * content is unchanged so its geometry (cached by identity) isn't rebuilt on every keystroke.
 */
function keepScene(next: WObject, prev: WObject | undefined): WObject {
  if (next.geom.kind !== 'sculpt' || prev?.geom.kind !== 'sculpt') return next
  const same = JSON.stringify(serializeScene(next.geom.scene)) === JSON.stringify(serializeScene(prev.geom.scene))
  return same ? { ...next, geom: prev.geom } : next
}

export function WorldPanel({ world, onWorld, onPreset, activePreset, selected, onSelect, onAddModelled, onImportFile, onExportJson, onEditSculpt }: WorldPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const imageCb = useRef<((url: string) => void) | null>(null)
  const [fieldSel, setFieldSel] = useState<string | null>(null)
  const index = world.objects.findIndex((o) => o.id === selected)
  const obj = index >= 0 ? world.objects[index] : null
  const field = world.fields.find((f) => f.id === fieldSel) ?? null

  const updateObj = (patch: Partial<WObject>, coalesce = true) =>
    obj && onWorld((w) => ({ ...w, objects: w.objects.map((o) => (o.id === obj.id ? { ...o, ...patch } : o)) }), coalesce)
  const updateField = (patch: Partial<Field>) => field && onWorld((w) => ({ ...w, fields: w.fields.map((f) => (f.id === field.id ? { ...f, ...patch } : f)) }))
  const setCam = (patch: Partial<World['camera']>) => onWorld((w) => ({ ...w, camera: { ...w.camera, ...patch } }))
  const stepPreset = (dir: number) => {
    const i = WORLD_PRESETS.findIndex((p) => p.key === activePreset)
    const next = WORLD_PRESETS[(i + dir + WORLD_PRESETS.length) % WORLD_PRESETS.length]
    onPreset(i < 0 && dir < 0 ? WORLD_PRESETS[WORLD_PRESETS.length - 1].key : next.key)
  }
  const addImage = () => {
    imageCb.current = (url) => {
      const o = makeObject('image', { geom: { ...(defaultGeom('image') as Extract<Geom, { kind: 'image' }>), url }, scale: [1.4, 1.4, 1.4], source: true })
      onWorld((w) => ({ ...w, objects: [...w.objects, o] }), false)
      onSelect(o.id)
    }
    imageRef.current?.click()
  }
  const add = (kind: GeomKind) => {
    const o = makeObject(kind, kind === 'text' ? { scale: [1.4, 1.4, 1.4] } : {})
    onWorld((w) => ({ ...w, objects: [...w.objects, o] }), false)
    onSelect(o.id)
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="world-gallery" className="text-xs text-muted-foreground">
          Start from the gallery ({WORLD_PRESETS.length})
        </label>
        <div className="flex gap-1.5">
          <button type="button" aria-label="Previous gallery scene" className={cn(BUTTON, 'h-9 px-2')} onClick={() => stepPreset(-1)}>
            <ChevronLeft className="size-3.5" aria-hidden />
          </button>
          <select
            id="world-gallery"
            value={activePreset ?? ''}
            onChange={(e) => e.target.value && onPreset(e.target.value)}
            className="h-9 min-w-0 flex-1 border border-border bg-background px-2 text-xs text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2"
          >
            {!activePreset && <option value="">{world.name ? `${world.name} (edited)` : 'Your scene'}</option>}
            {WORLD_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <button type="button" aria-label="Next gallery scene" className={cn(BUTTON, 'h-9 px-2')} onClick={() => stepPreset(1)}>
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
        {activePreset && <p className="text-[11px] leading-relaxed text-muted-foreground">{WORLD_PRESETS.find((p) => p.key === activePreset)?.blurb}</p>}
      </div>
      <TextField label="Scene name" mono={false} value={world.name ?? ''} placeholder="Untitled scene" onChange={(name) => onWorld((w) => ({ ...w, name: name.slice(0, 80) || undefined }))} />

      {/* ---- objects ---- */}
      <Group
        title={`Objects (${world.objects.length})`}
        action={
          <select
            aria-label="Add object"
            value=""
            onChange={(e) => {
              const v = e.target.value
              if (v === 'image') addImage()
              else if (v === 'sculpt') onAddModelled()
              else if (v) add(v as GeomKind)
            }}
            className="h-7 border border-border bg-background px-1 text-[11px] tracking-wide text-foreground normal-case"
          >
            <option value="">+ Add…</option>
            {ADD_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
            <option value="image">Image…</option>
            <option value="sculpt">From the modeller</option>
          </select>
        }
      >
        {world.objects.length > 0 && (
          <ul aria-label="Objects" className="flex max-h-56 flex-col overflow-y-auto border border-border">
            {world.objects.map((o, i) => (
              <li key={o.id} className="flex items-stretch border-b border-dashed border-border last:border-b-0">
                <button
                  type="button"
                  aria-pressed={o.id === selected}
                  onClick={() => onSelect(o.id === selected ? null : o.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:-outline-offset-2',
                    o.id === selected ? 'bg-foreground text-background' : 'hover:bg-accent',
                    o.hidden && 'opacity-50',
                  )}
                >
                  <span aria-hidden className="size-2.5 shrink-0 border border-border" style={{ background: o.color }} />
                  <span className="truncate">{objectLabel(o, i)}</span>
                  {o.array && <span className="ml-auto text-[10px] opacity-70">×{o.array.count}</span>}
                </button>
                <button type="button" aria-label={`${o.hidden ? 'Show' : 'Hide'} ${objectLabel(o, i)}`} className="px-1.5 text-muted-foreground hover:text-foreground" onClick={() => onWorld((w) => ({ ...w, objects: w.objects.map((x) => (x.id === o.id ? { ...x, hidden: !x.hidden || undefined } : x)) }), false)}>
                  {o.hidden ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                </button>
                <button
                  type="button"
                  aria-label={`Duplicate ${objectLabel(o, i)}`}
                  className="px-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const copy = { ...o, id: newId(), name: o.name ? `${o.name} copy` : undefined, pos: [o.pos[0] + 0.2, o.pos[1], o.pos[2]] as Vec3 }
                    onWorld((w) => ({ ...w, objects: [...w.objects.slice(0, i + 1), copy, ...w.objects.slice(i + 1)] }), false)
                    onSelect(copy.id)
                  }}
                >
                  <Copy className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${objectLabel(o, i)}`}
                  className="px-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    onWorld((w) => ({ ...w, objects: w.objects.filter((x) => x.id !== o.id) }), false)
                    if (selected === o.id) onSelect(null)
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        {!obj && world.objects.length > 0 && <p className="text-[11px] leading-relaxed text-muted-foreground">Click an object here or on the canvas to edit it.</p>}
      </Group>

      {obj && (
        <div className="flex flex-col gap-4 border-l border-dashed border-foreground/40 pl-3">
          <TextField label="Name" value={obj.name ?? ''} mono={false} placeholder={objectLabel({ ...obj, name: undefined }, index)} onChange={(name) => updateObj({ name: name || undefined })} />
          <GeomEditor
            geom={obj.geom}
            onChange={(geom) => updateObj({ geom })}
            onImage={(cb) => {
              imageCb.current = cb
              imageRef.current?.click()
            }}
            onEditSculpt={() => onEditSculpt(obj.id)}
          />

          <Disclosure title="Transform" defaultOpen>
            <VecSliders label="Position" value={obj.pos} min={-4} max={4} step={0.01} def={0} onChange={(pos) => updateObj({ pos })} />
            <VecSliders label="Rotation (°)" value={obj.rot} min={-180} max={180} step={1} def={0} onChange={(rot) => updateObj({ rot })} />
            <SliderField
              label="Size"
              value={Math.max(...obj.scale.map(Math.abs))}
              min={0.01}
              max={8}
              step={0.01}
              onChange={(v) => {
                const m = Math.max(...obj.scale.map(Math.abs)) || 1
                updateObj({ scale: obj.scale.map((s) => +((s / m) * v).toFixed(4)) as Vec3 })
              }}
            />
            <VecSliders label="Stretch" value={obj.scale} min={0.01} max={8} step={0.01} def={1} onChange={(scale) => updateObj({ scale })} />
          </Disclosure>

          <Disclosure title="Material" defaultOpen>
            <SwatchRow
              items={[
                { label: 'Lit', value: obj.color, onChange: (color) => updateObj({ color }) },
                ...(obj.shadow !== undefined ? [{ label: 'Shadow', value: obj.shadow, onChange: (shadow: string) => updateObj({ shadow }) }] : []),
              ]}
              action={
                <button type="button" className="text-[11px] tracking-widest text-muted-foreground uppercase hover:text-foreground" onClick={() => updateObj({ shadow: obj.shadow === undefined ? '#1a1a1a' : undefined })}>
                  {obj.shadow === undefined ? '+ Shadow colour' : 'Auto shadow'}
                </button>
              }
            />
            <TextField label="Characters (dark → light, blank = scene default)" value={obj.charset ?? ''} placeholder="scene default" onChange={(charset) => updateObj({ charset: charset || undefined })} />
            <SliderField label="Self-lit" value={obj.emissive} min={0} max={1} step={0.01} defaultValue={0} format={(v) => `${Math.round(v * 100)}%`} onChange={(emissive) => updateObj({ emissive })} />
            <ToggleField label="Use painted / image colors" value={!!obj.source} onChange={(source) => updateObj({ source: source || undefined })} />
            <ToggleField label="Colour by height (shadow → lit, bottom → top)" value={obj.tint === 'height'} onChange={(on) => updateObj({ tint: on ? 'height' : undefined })} />
          </Disclosure>

          <BehaviourList anim={obj.anim} onChange={(anim) => updateObj({ anim }, false)} />

          <Disclosure title="Array (copies)" meta={obj.array ? `×${obj.array.count}` : 'off'}>
            <ToggleField
              label="Repeat in rings, rows, spirals or waves"
              value={!!obj.array}
              onChange={(on) => updateObj({ array: on ? { count: 6, offset: [0.6, 0, 0], step: [0, 0, 0], rot: [0, 60, 0], grow: 1, spin: 0, phase: 0 } : undefined }, false)}
            />
            {obj.array && <ArrayEditor array={obj.array} onChange={(array) => updateObj({ array })} />}
          </Disclosure>

          <Disclosure title="JSON">
            <JsonEditor
              key={obj.id}
              label="This object — every setting, as stored"
              value={objectJson(obj)}
              parse={(d) => parseObject(d && typeof d === 'object' ? { ...d, id: obj.id } : d)}
              onApply={(next) => onWorld((w) => ({ ...w, objects: w.objects.map((o) => (o.id === obj.id ? keepScene(next, o) : o)) }))}
            />
          </Disclosure>
        </div>
      )}

      {/* ---- fields ---- */}
      <Group
        title={`Background & atmosphere (${world.fields.length})`}
        action={
          <select
            aria-label="Add field"
            value=""
            onChange={(e) => {
              if (!e.target.value) return
              const nf = defaultField(e.target.value as FieldType)
              onWorld((w) => ({ ...w, fields: [...w.fields, nf] }), false)
              setFieldSel(nf.id)
            }}
            className="h-7 border border-border bg-background px-1 text-[11px] tracking-wide text-foreground normal-case"
          >
            <option value="">+ Add…</option>
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        }
      >
        {world.fields.length > 0 && (
          <ul aria-label="Fields" className="flex flex-col border border-border">
            {world.fields.map((fl) => (
              <li key={fl.id} className="flex items-stretch border-b border-dashed border-border last:border-b-0">
                <button
                  type="button"
                  aria-pressed={fl.id === fieldSel}
                  onClick={() => setFieldSel(fl.id === fieldSel ? null : fl.id)}
                  className={cn('flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors', fl.id === fieldSel ? 'bg-foreground text-background' : 'hover:bg-accent', fl.hidden && 'opacity-50')}
                >
                  <span aria-hidden className="h-2.5 w-5 shrink-0 border border-border" style={{ background: `linear-gradient(90deg, ${fl.colors.join(',')})` }} />
                  <span className="truncate capitalize">{fl.type}</span>
                  <span className="ml-auto text-[10px] tracking-widest uppercase opacity-70">{fl.layer}</span>
                </button>
                <button type="button" aria-label={`${fl.hidden ? 'Show' : 'Hide'} ${fl.type}`} className="px-1.5 text-muted-foreground hover:text-foreground" onClick={() => onWorld((w) => ({ ...w, fields: w.fields.map((x) => (x.id === fl.id ? { ...x, hidden: !x.hidden || undefined } : x)) }), false)}>
                  {fl.hidden ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                </button>
                <button type="button" aria-label={`Delete ${fl.type}`} className="px-1.5 text-muted-foreground hover:text-foreground" onClick={() => onWorld((w) => ({ ...w, fields: w.fields.filter((x) => x.id !== fl.id) }), false)}>
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        {field && (
          <div className="flex flex-col gap-4 border-l border-dashed border-foreground/40 pl-3">
            <SelectField label="Pattern" value={field.type} options={opts(FIELD_TYPES)} onChange={(type) => updateField({ type })} />
            <Segmented label="Layer" value={field.layer} options={[{ value: 'back', label: 'Behind' }, { value: 'front', label: 'In front' }]} onChange={(layer) => updateField({ layer })} />
            <TextField label="Characters (low → high)" value={field.charset} onChange={(charset) => charset && updateField({ charset })} />
            <ToggleField label="Random glyphs (matrix, stars)" value={!!field.random} onChange={(random) => updateField({ random })} />
            {field.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <ColorField label={`Color ${i + 1}`} value={c} onChange={(v) => updateField({ colors: field.colors.map((x, j) => (j === i ? v : x)) })} />
                </div>
                {field.colors.length > 2 && (
                  <button type="button" aria-label={`Remove color ${i + 1}`} className="text-muted-foreground hover:text-foreground" onClick={() => updateField({ colors: field.colors.filter((_, j) => j !== i) })}>
                    <X className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            ))}
            {field.colors.length < 6 && (
              <button type="button" className={BUTTON} onClick={() => updateField({ colors: [...field.colors, field.colors[field.colors.length - 1]] })}>
                + Color stop
              </button>
            )}
            <SliderField label="Scale" value={field.scale} min={0.05} max={5} step={0.01} defaultValue={1} onChange={(scale) => updateField({ scale })} />
            <SliderField label="Speed" value={field.speed} min={-5} max={5} step={0.01} defaultValue={1} onChange={(speed) => updateField({ speed })} />
            <SliderField label="Intensity" value={field.intensity} min={0} max={1.5} step={0.01} defaultValue={1} onChange={(intensity) => updateField({ intensity })} />
            <SliderField label={field.type === 'grid' ? 'Horizon' : 'Angle'} value={field.angle} min={-180} max={180} step={1} defaultValue={90} format={deg} onChange={(angle) => updateField({ angle })} />
            <SliderField label="Seed" value={field.seed} min={0} max={99} step={1} defaultValue={1} onChange={(seed) => updateField({ seed })} />
            <Disclosure title="JSON">
              <JsonEditor
                key={field.id}
                label="This layer — every setting, as stored"
                rows={8}
                value={fieldJson(field)}
                parse={(d) => parseField(d && typeof d === 'object' ? { ...d, id: field.id } : d)}
                onApply={(next) => onWorld((w) => ({ ...w, fields: w.fields.map((f) => (f.id === field.id ? next : f)) }))}
              />
            </Disclosure>
          </div>
        )}
      </Group>

      {/* ---- camera ---- */}
      <Disclosure title="Camera & loop" meta={`${world.duration}s loop`}>
        <VecField label="Tilt · turn · roll (°)" value={world.camera.rot} min={-180} max={180} step={1} onChange={(rot) => setCam({ rot })} />
        <SliderField label="Perspective" value={world.camera.fov} min={0} max={0.95} step={0.01} defaultValue={0.25} format={(v) => (v === 0 ? 'flat (2D)' : v.toFixed(2))} onChange={(fov) => setCam({ fov })} />
        <SliderField label="Zoom" value={world.camera.zoom} min={0.2} max={4} step={0.01} defaultValue={1} onChange={(zoom) => setCam({ zoom })} />
        <SliderField label="Pan X" value={world.camera.pan[0]} min={-2} max={2} step={0.01} defaultValue={0} onChange={(v) => setCam({ pan: [v, world.camera.pan[1]] })} />
        <SliderField label="Pan Y" value={world.camera.pan[1]} min={-2} max={2} step={0.01} defaultValue={0} onChange={(v) => setCam({ pan: [world.camera.pan[0], v] })} />
        <SliderField label="View size" value={world.fit} min={0.2} max={8} step={0.01} defaultValue={1.4} onChange={(fit) => onWorld((w) => ({ ...w, fit }))} />
        <SliderField label="Loop length (s)" value={world.duration} min={1} max={60} step={0.5} defaultValue={12} onChange={(duration) => onWorld((w) => ({ ...w, duration }))} />
        <BehaviourList label="Camera motion" anim={world.camera.anim} onChange={(anim) => setCam({ anim })} />
        <JsonEditor
          label="Camera JSON"
          rows={8}
          value={world.camera}
          parse={(d) => (d && typeof d === 'object' ? parseWorld({ camera: d })!.camera : null)}
          onApply={(camera) => onWorld((w) => ({ ...w, camera }))}
        />
      </Disclosure>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="sr-only"
        tabIndex={-1}
        aria-label="Import world JSON"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImportFile(file)
          e.target.value = ''
        }}
      />
      <input
        ref={imageRef}
        type="file"
        accept="image/*,.svg"
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose image"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) imageCb.current?.(URL.createObjectURL(file))
          e.target.value = ''
        }}
      />
      <Disclosure title="Files & reset">
        <div className="grid grid-cols-3 gap-1.5">
          <button type="button" className={BUTTON} onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button type="button" className={BUTTON} onClick={onExportJson}>
            Export
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={() => {
              onWorld(() => emptyWorld(), false)
              onSelect(null)
            }}
          >
            Empty
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">Uploaded images stay in this browser; Export keeps everything. Perspective 0 makes a flat 2D scene.</p>
      </Disclosure>
      <Disclosure title="Scene JSON">
        <JsonEditor
          label="The whole scene — objects, layers, camera, loop"
          rows={16}
          value={serializeWorld(world)}
          parse={(d) => (d && typeof d === 'object' && Array.isArray((d as { objects?: unknown }).objects) ? parseWorld(d) : null)}
          onApply={(next) => onWorld((w) => ({ ...next, objects: next.objects.map((o) => keepScene(o, w.objects.find((x) => x.id === o.id))) }))}
        />
      </Disclosure>
    </>
  )
}

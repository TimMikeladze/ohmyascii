'use client'

import { useRef } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { PRIM_TYPES, emptyScene, makePrim, newId, parseScene, serializeScene, starterScene, type MeshScene, type Prim, type ShapeOp, type Vec3 } from '@/lib/ascii/scene'
import { cn } from '@/lib/utils'
import { Disclosure, JsonEditor, Segmented, SliderField, VecField } from './controls'
import type { SceneTool } from './types'

export const TOOLS: { value: SceneTool; label: string; key: string; hint: string }[] = [
  { value: 'orbit', label: 'Orbit', key: 'o', hint: 'Drag to rotate' },
  { value: 'select', label: 'Select', key: 'v', hint: 'Click a shape to edit it' },
  { value: 'paint', label: 'Paint', key: 'b', hint: 'Drag to paint the surface' },
  { value: 'sculpt-add', label: 'Clay', key: 'g', hint: 'Drag to build up material' },
  { value: 'sculpt-carve', label: 'Carve', key: 'e', hint: 'Drag to dig into the surface' },
]

const BUTTON =
  'h-8 border border-border px-2 text-[11px] tracking-widest uppercase transition-colors hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50'

export function primLabel(scene: MeshScene, p: Prim, i: number): string {
  if (p.type === 'mesh') return (p.meshId && scene.meshes[p.meshId]?.name) || 'Mesh'
  return `${p.type[0].toUpperCase()}${p.type.slice(1)} ${i + 1}`
}

interface ModelPanelProps {
  scene: MeshScene
  /** `coalesce` merges rapid edits (slider drags) into one undo step. */
  onScene: (update: (s: MeshScene) => MeshScene, coalesce?: boolean) => void
  selected: string | null
  onSelect: (id: string | null) => void
  onImportFile: (file: File) => void
  onExportJson: () => void
  onExportPly: () => void
  /** Set while editing a world's modelled object: save writes the scene back to it. */
  linked?: { name: string; onSave: () => void; onCancel: () => void }
}

export function ModelPanel({
  scene,
  onScene,
  selected,
  onSelect,
  onImportFile,
  onExportJson,
  onExportPly,
  linked,
}: ModelPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const index = scene.prims.findIndex((p) => p.id === selected)
  const prim = index >= 0 ? scene.prims[index] : null

  const updatePrim = (patch: Partial<Prim>) =>
    prim && onScene((s) => ({ ...s, prims: s.prims.map((p) => (p.id === prim.id ? { ...p, ...patch } : p)) }))
  const add = (type: (typeof PRIM_TYPES)[number]['type']) => {
    const p = makePrim(type, { scale: [0.6, 0.6, 0.6], pos: [0, 0, 0] })
    onScene((s) => ({ ...s, prims: [...s.prims, p] }), false)
    onSelect(p.id)
  }
  const remove = (id: string) => {
    onScene((s) => ({ ...s, prims: s.prims.filter((p) => p.id !== id) }), false)
    if (selected === id) onSelect(null)
  }
  const duplicate = (p: Prim) => {
    const copy = { ...p, id: newId(), pos: [p.pos[0] + 0.15, p.pos[1], p.pos[2]] as Vec3 }
    onScene((s) => ({ ...s, prims: [...s.prims, copy] }), false)
    onSelect(copy.id)
  }

  return (
    <>
      {linked && (
        <div role="status" className="flex flex-col gap-2 border border-foreground p-2.5 text-xs">
          <span>
            Editing <span className="font-medium">{linked.name}</span> from your scene.
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" className={cn(BUTTON, 'bg-foreground text-background')} onClick={linked.onSave}>
              Save to scene
            </button>
            <button type="button" className={BUTTON} onClick={linked.onCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Add shape</span>
        <div className="flex flex-wrap gap-1.5">
          {PRIM_TYPES.map((t) => (
            <button key={t.type} type="button" className={cn(BUTTON, 'h-7 px-2.5')} onClick={() => add(t.type)}>
              + {t.label}
            </button>
          ))}
          <button type="button" className={cn(BUTTON, 'h-7 px-2.5')} onClick={() => fileRef.current?.click()} title="Import an OBJ / STL mesh or a scene JSON">
            + Import…
          </button>
        </div>
      </div>

      {scene.prims.length > 0 && (
        <ul aria-label="Shapes" className="flex max-h-52 flex-col overflow-y-auto border border-border">
          {scene.prims.map((p, i) => (
            <li key={p.id} className="flex items-stretch border-b border-dashed border-border last:border-b-0">
              <button
                type="button"
                aria-pressed={p.id === selected}
                onClick={() => onSelect(p.id === selected ? null : p.id)}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-dashed focus-visible:-outline-offset-2',
                  p.id === selected ? 'bg-foreground text-background' : 'hover:bg-accent',
                )}
              >
                <span aria-hidden className="size-2.5 shrink-0 border border-border" style={{ background: p.color }} />
                <span className="truncate">{primLabel(scene, p, i)}</span>
                {p.op === 'subtract' && <span className="ml-auto text-[10px] tracking-widest uppercase opacity-70">cut</span>}
              </button>
              <button type="button" aria-label={`Duplicate ${primLabel(scene, p, i)}`} className="px-2 text-muted-foreground hover:text-foreground" onClick={() => duplicate(p)}>
                <Copy className="size-3.5" aria-hidden />
              </button>
              <button type="button" aria-label={`Delete ${primLabel(scene, p, i)}`} className="px-2 text-muted-foreground hover:text-foreground" onClick={() => remove(p.id)}>
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {prim ? (
        <div className="flex flex-col gap-4 border-l border-dashed border-foreground/40 pl-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Segmented<ShapeOp>
                label={primLabel(scene, prim, index)}
                value={prim.op}
                options={[
                  { value: 'add', label: 'Add' },
                  { value: 'subtract', label: 'Cut away' },
                ]}
                onChange={(op) => updatePrim({ op })}
              />
            </div>
            <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              Colour
              <input type="color" value={prim.color} onChange={(e) => updatePrim({ color: e.target.value })} className="size-8 cursor-pointer border border-border bg-transparent p-0" />
            </label>
          </div>
          <VecField label="Position" value={prim.pos} min={-1.5} max={1.5} step={0.01} defaultValue={0} onChange={(pos) => updatePrim({ pos })} />
          <VecField label="Rotation (°)" value={prim.rot} min={-180} max={180} step={1} defaultValue={0} onChange={(rot) => updatePrim({ rot })} />
          <SliderField
            label="Size"
            value={Math.max(...prim.scale)}
            min={0.05}
            max={3}
            step={0.01}
            onChange={(v) => {
              const m = Math.max(...prim.scale) || 1
              updatePrim({ scale: prim.scale.map((s) => +((s / m) * v).toFixed(3)) as Vec3 })
            }}
          />
          <VecField label="Stretch" value={prim.scale} min={0.05} max={3} step={0.01} defaultValue={1} onChange={(scale) => updatePrim({ scale })} />
        </div>
      ) : (
        scene.prims.length > 0 && <p className="text-[11px] text-muted-foreground">Select a shape in the list or with the Select tool (v) to edit it.</p>
      )}

      <SliderField
        label="Blend between shapes"
        value={scene.blend}
        min={0}
        max={0.4}
        step={0.005}
        defaultValue={0.08}
        format={(v) => (v === 0 ? 'hard' : v.toFixed(3))}
        onChange={(blend) => onScene((s) => ({ ...s, blend }))}
      />

      <input
        ref={fileRef}
        type="file"
        accept=".obj,.stl,.json"
        className="sr-only"
        tabIndex={-1}
        aria-label="Import OBJ, STL or scene JSON"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImportFile(file)
          e.target.value = ''
        }}
      />
      <Disclosure title="JSON">
        <JsonEditor
          label="Shapes, sculpt dabs and blend (paint and imported meshes are kept)"
          rows={12}
          value={{ prims: scene.prims, dabs: scene.dabs, blend: scene.blend }}
          parse={(d) => (d && typeof d === 'object' ? parseScene({ ...serializeScene(scene), ...(d as object) }) : null)}
          onApply={(next) => onScene(() => next)}
        />
      </Disclosure>
      <Disclosure title="Files & reset">
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" className={BUTTON} onClick={onExportJson}>
            Save scene JSON
          </button>
          <button type="button" className={BUTTON} onClick={onExportPly}>
            PLY points
          </button>
          <button type="button" className={BUTTON} disabled={!scene.dabs.length} onClick={() => onScene((s) => ({ ...s, dabs: [] }), false)}>
            Clear sculpt{scene.dabs.length ? ` (${scene.dabs.length})` : ''}
          </button>
          <button type="button" className={BUTTON} disabled={!Object.keys(scene.paint).length} onClick={() => onScene((s) => ({ ...s, paint: {} }), false)}>
            Clear paint
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={() => {
              onScene(() => starterScene(), false)
              onSelect(null)
            }}
          >
            Starter scene
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={() => {
              onScene(() => emptyScene(), false)
              onSelect(null)
            }}
          >
            Empty
          </button>
        </div>
      </Disclosure>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Tools are on the canvas: select · paint · clay · carve. Paint shows in Look → Colour → Image. <kbd>[</kbd> <kbd>]</kbd> brush size, alt-drag orbits.
      </p>
    </>
  )
}

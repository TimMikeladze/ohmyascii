import type { AsciiConfig } from '@/lib/ascii/config'
import type { Dab, MeshScene, Prim } from '@/lib/ascii/scene'
import type { ArraySpec, Behaviour, Camera, Field, Geom, Keyframe, World, WObject } from '@/lib/ascii/world'

// Studio ⇄ JSON parity (AGENTS.md → "Studio and JSON stay in sync"). Every key the piece / world /
// scene format stores maps to the label of the studio control that edits it. The types make this
// exhaustive: adding a key to the format without an entry here fails `bun run typecheck`, and
// coverage.test.ts fails if a label isn't in the studio's source. `null` = internal, never shown
// (ids). Everything is also editable in the JSON boxes, which go through the same parsers.

type Cover<T> = { [K in keyof Required<T>]: string | null }
type Variant<U, K extends string, V> = Extract<U, Record<K, V>>
type CoverUnion<U, K extends keyof U & string> = { [V in U[K] & string]: Cover<Variant<U, K, V>> }

export const CONFIG_UI: Cover<AsciiConfig> = {
  shape: '3D mode',
  maskMode: 'Cut out from',
  invertMask: 'Invert silhouette',
  threshold: 'Threshold',
  smooth: 'Edge smoothing',
  thickness: 'Thickness',
  reliefDepth: 'Relief depth',
  charset: 'Custom ramp (dark → bright)',
  fontKey: 'Typeface',
  fontWeight: 'Weight',
  cellSize: 'Cell size',
  cellAspect: 'Cell aspect',
  glyphScale: 'Glyph scale',
  colorMode: 'Colour',
  fg: 'Bright',
  fg2: 'Dark',
  bg: 'Background',
  transparentBg: 'Transparent background',
  shade: 'Brightness from',
  brightness: 'Brightness',
  contrast: 'Contrast',
  gamma: 'Gamma',
  invert: 'Invert tones',
  ambient: 'Ambient',
  lightAzimuth: 'Light direction',
  lightElevation: 'Light height',
  pointerLight: 'Light follows cursor',
  depthFade: 'Depth fade',
  gridDots: 'Dotted grid behind',
  gridChar: 'Grid glyph',
  gridColor: 'Grid colour',
  gridOpacity: 'Grid opacity',
  motion: 'Animation',
  rotX: 'Base rotation (°)',
  rotY: 'Base rotation (°)',
  rotZ: 'Base rotation (°)',
  spinX: 'Spin (°/s)',
  spinY: 'Spin (°/s)',
  spinZ: 'Spin (°/s)',
  swayX: 'Sway up / down',
  swayY: 'Sway left / right',
  swaySpeed: 'Sway speed',
  interactive: 'Drag to rotate (360°)',
  inertia: 'Drag glide',
  wheelZoom: 'Scroll to zoom',
  zoom: 'Zoom',
  perspective: 'Perspective',
  offsetX: 'Offset X',
  offsetY: 'Offset Y',
  waveAmp: 'Wave',
  waveFreq: 'Wave frequency',
  waveSpeed: 'Wave speed',
  shimmer: 'Glyph shimmer',
  scanStrength: 'Scanline glow',
  scanSpeed: 'Scanline speed',
  intro: 'Intro dissolve',
}

export const WORLD_UI: Cover<World> = {
  name: 'Scene name',
  duration: 'Loop length (s)',
  fit: 'View size',
  camera: 'Camera & loop',
  fields: 'Background & atmosphere',
  objects: 'Add object',
}

export const CAMERA_UI: Cover<Camera> = {
  rot: 'Tilt · turn · roll (°)',
  zoom: 'Zoom',
  fov: 'Perspective',
  pan: 'Pan X',
  anim: 'Camera motion',
}

export const OBJECT_UI: Cover<WObject> = {
  id: null,
  name: 'Name',
  geom: 'Add object',
  pos: 'Position',
  rot: 'Rotation (°)',
  scale: 'Stretch',
  color: 'Lit',
  shadow: 'Shadow colour',
  charset: 'Characters (dark → light, blank = scene default)',
  emissive: 'Self-lit',
  source: 'Use painted / image colors',
  tint: 'Colour by height',
  anim: 'Add animation',
  array: 'Array (copies)',
  hidden: 'Hide',
}

export const FIELD_UI: Cover<Field> = {
  id: null,
  type: 'Pattern',
  layer: 'Layer',
  charset: 'Characters (low → high)',
  colors: '+ Color stop',
  scale: 'Scale',
  speed: 'Speed',
  intensity: 'Intensity',
  angle: 'Angle',
  seed: 'Seed',
  random: 'Random glyphs',
  hidden: 'Hide',
}

export const ARRAY_UI: Cover<ArraySpec> = {
  count: 'Copies',
  offset: 'Offset',
  step: 'Step move',
  rot: 'Step turn',
  grow: 'Step grow',
  spin: 'Whole-array spin',
  phase: 'Stagger',
  jitter: 'Height jitter',
}

export const KEYFRAME_UI: Cover<Keyframe> = {
  t: 'time (s)',
  pos: 'Move',
  rot: 'Turn',
  scale: 'Scale',
}

export const GEOM_UI: CoverUnion<Geom, 'kind'> = {
  shape: { kind: 'Solid', type: 'Solid' },
  sculpt: { kind: 'From the modeller', scene: 'Edit in the modeller' },
  flat: { kind: '2D shape', type: '2D shape', sides: 'Sides', inner: 'Inner', round: 'Rounding', bevel: 'Bevel (pillow)', depth: 'Thickness' },
  text: { kind: 'Text', text: 'Text', fontKey: 'Font', weight: 'Weight', depth: 'Depth' },
  image: { kind: 'Image…', url: 'Image URL', depth: 'Depth', relief: 'Depth relief (photos)' },
  curve: { kind: 'Curve', type: 'Curve', turns: 'Turns', p: 'Strands', q: '"Q"', tube: 'Tube radius' },
  terrain: { kind: 'Terrain', type: 'Terrain', amp: 'Height', freq: 'Detail', speed: 'Flow speed', seed: 'Seed' },
  particles: { kind: 'Particles', type: 'Particles', count: 'Count', speed: 'Speed', seed: 'Seed' },
}

export const BEHAVIOUR_UI: CoverUnion<Behaviour, 'type'> = {
  spin: { type: 'Spin', axis: 'Axis', speed: 'Speed (°/s)' },
  orbit: { type: 'Orbit', radius: 'Radius', speed: 'Speed (°/s)', tilt: 'Tilt', phase: 'Start angle', plane: 'Plane' },
  bob: { type: 'Bob', axis: 'Axis', amp: 'Distance', speed: 'Speed (cycles/s)', phase: 'Phase' },
  pulse: { type: 'Pulse', amp: 'Amount', speed: 'Speed (cycles/s)', phase: 'Phase' },
  sway: { type: 'Sway', axis: 'Axis', amp: 'Angle', speed: 'Speed (cycles/s)', phase: 'Phase' },
  drift: { type: 'Drift', vel: 'Velocity', wrap: 'Wrap distance' },
  keys: { type: 'Keyframes', loop: 'Loop (s)', ease: 'Easing', keys: '+ Key' },
  wave: { type: 'Wave (deform)', axis: 'Displace', amp: 'Amount', freq: 'Frequency', speed: 'Speed (cycles/s)' },
  twist: { type: 'Twist (deform)', amount: 'Amount (°/unit)', speed: 'Speed (cycles/s, 0 = fixed)' },
}

export const SCENE_UI: Cover<MeshScene> = {
  prims: 'Add shape',
  dabs: 'Clay',
  paint: 'Paint',
  blend: 'Blend between shapes',
  meshes: '+ Import…',
}

export const PRIM_UI: Cover<Prim> = {
  id: null,
  type: 'Add shape',
  op: 'Cut away',
  pos: 'Position',
  rot: 'Rotation (°)',
  scale: 'Stretch',
  color: 'Colour',
  meshId: '+ Import…',
}

/** Sculpt dabs are made with the canvas brushes (and editable in Model → JSON). */
export const DAB_UI: Cover<Dab> = {
  p: 'Clay',
  r: 'Brush size',
  op: 'Carve',
  color: 'Clay',
}

/** Every table, for the test. */
export const COVERAGE: Record<string, Record<string, string | null>> = {
  config: CONFIG_UI,
  world: WORLD_UI,
  camera: CAMERA_UI,
  object: OBJECT_UI,
  field: FIELD_UI,
  array: ARRAY_UI,
  keyframe: KEYFRAME_UI,
  scene: SCENE_UI,
  prim: PRIM_UI,
  dab: DAB_UI,
  ...Object.fromEntries(Object.entries(GEOM_UI).map(([k, v]) => [`geom.${k}`, v])),
  ...Object.fromEntries(Object.entries(BEHAVIOUR_UI).map(([k, v]) => [`behaviour.${k}`, v])),
}

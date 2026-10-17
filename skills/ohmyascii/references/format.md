# Piece, geometry, animation, and configuration reference

## Envelope and parsing

A piece is `<slug>.ascii.json` containing `{v:1,name?,source,config}`. Use valid JSON: quoted keys, no comments, no trailing commas, and calculated numeric values instead of expressions. `config` can be a partial diff; omitted settings use engine defaults. Unknown or malformed fields may be dropped or replaced. Inspect normalization as well as parse success.

```json
{
  "v": 1,
  "name": "Orbital mark",
  "source": { "kind": "preset", "key": "rings" },
  "config": { "charset": " .:-=+*#%@", "colorMode": "mono", "fg": "#f2f2f2", "gridDots": false }
}
```

The in-app chat expects `{world,config}` inside its response; a file expects `source:{kind:"world",world}`. World exports and modeller scene exports are also distinct envelopes. Never rename one kind of JSON to a piece without wrapping its source correctly.

| Source kind | Fields and purpose |
|---|---|
| `preset` | `key`: `starburst`, `spiral`, `rings`, `bolt`, `heart`, `hexagon`, `star`; one graphic mark |
| `text` | `text` up to 400 characters; optional `fontKey`, `weight` 100–900; keep lettering short enough to read |
| `image` | `path` relative to the piece; SVG/PNG/JPEG/WebP/GIF; assets delivered alongside the file |
| `scene` | `scene`: a modeller scene of prims, sculpt dabs, paint and optional imported meshes |
| `world` | `world`: independent objects, procedural fields, camera and animation |

Authority: `lib/ascii/piece.ts`, `lib/ascii/config.ts`, `lib/ascii/scene.ts`, `lib/ascii/world.ts`. Use MCP `studio_guide` for current engine guidance and `get_gallery_piece` for fully expanded examples.

## World coordinates and camera

World: `{name?,duration,fit,camera,fields:[],objects:[]}`. `duration` accepts 1–120 seconds; 8–24 is a useful ambient starting point. `fit` is the world half-extent visible on the **shorter pixel side**, not always the vertical half-height. It accepts 0.1–50; start around 1–1.5 and inspect the actual target. Screen-space fields use their own coordinates and do not follow object transforms.

Y points up, X right, +Z toward the viewer before camera rotation. Euler rotations are degrees. Shapes are centered around their origin; most are roughly one unit across before scaling. Check exact defaults for procedural curves and sculpts.

Camera: `{rot:[tilt,turn,roll],zoom,fov,pan:[x,y],anim:[]}`. Negative tilt looks downward. `zoom` accepts 0.05–20; `fov` 0–0.95. For flat top-down XY compositions use `rot:[0,0,0]`, `fov:0`; 3D often starts at `rot:[-15,0,0]`, `fov:0.3`. At zero rotation, larger Z layers cover lower Z layers. `pan` shifts the view; test its visible direction instead of guessing.

### World source example

This source fragment goes inside a piece's `source`. It deliberately uses static atmosphere and precisely periodic movement for a 12-second loop.

```json
{ "kind": "world", "world": {
  "name": "Moon garden", "duration": 12, "fit": 1.2,
  "camera": { "rot": [0, 0, 0], "zoom": 1, "fov": 0, "pan": [0, 0], "anim": [] },
  "fields": [
    { "type": "gradient", "layer": "back", "charset": " .:", "colors": ["#050b18", "#152a3b"], "angle": 90, "speed": 0 }
  ],
  "objects": [
    { "name": "Moon", "geom": { "kind": "flat", "type": "moon", "bevel": 0 },
      "pos": [0.45, 0.4, -0.1], "scale": [0.55, 0.55, 1], "color": "#fff1d0", "emissive": 1,
      "charset": " .:-=+*#%@", "anim": [{ "type": "bob", "axis": "y", "amp": 0.04, "speed": 0.08333333333333333 }] },
    { "name": "Petal ring", "geom": { "kind": "flat", "type": "petal", "bevel": 0.2 },
      "pos": [-0.2, -0.2, 0.1], "scale": [0.22, 0.32, 1], "color": "#9bd7b0", "shadow": "#153d37",
      "array": { "count": 8, "offset": [0, 0.38, 0], "rot": [0, 0, 45], "spin": 30 }, "anim": [] }
  ]
} }
```

## World objects and materials

Object: `{id?,name?,geom,pos:[x,y,z],rot:[x,y,z],scale:[x,y,z],color,shadow?,charset?,emissive,source?,tint?,anim:[],array?,hidden?}`. Parsers supply missing defaults, but include meaningful placement, scale, material and motion explicitly. `id` is generated if absent; retain IDs while editing an existing piece.

`color` is the lit material color and `shadow` its dark end. Hex colors accept `#rgb` or `#rrggbb`. `charset` is a dark-to-bright ramp, `emissive` 0–1 controls self-lit appearance, `source:true` selects sculpt/image source colors, `tint:"height"` selects bottom-to-top coloration. `hidden:true` keeps an object stored but not drawn. There is no arbitrary opacity, roughness, glow, parent transform, skeletal rig, shader snippet, or event emitter key.

World materials use their own colors; global `colorMode`/`fg` do not provide a universal world recolor. Standalone image/text/model sources do use global color modes. For a source-colored standalone sculpt, use `config.colorMode:"source"`; for a sculpt inside a world, use its object's `source:true`.

| `geom.kind` | Supported fields |
|---|---|
| `shape` | `type`: `sphere`, `box`, `cylinder`, `torus`, `cone` |
| `flat` | `type`: `circle`, `ring`, `rect`, `star`, `polygon`, `heart`, `moon`, `petal`, `cross`, `triangle`; `sides` 3–64; `inner` 0.05–0.99; `round` 0–0.4; `bevel` 0–0.5; `depth` 0–1 |
| `sculpt` | `scene`: modeller scene, below; one object for a coherent multi-prim creature |
| `text` | `text` up to 200 characters, `fontKey`, `weight` 100–900, `depth` 0–1 |
| `image` | `url`, `depth` 0–1, `relief` boolean; world image uses `url`, piece image source uses `path` |
| `curve` | `type`: `helix`, `knot`, `lissajous`, `spiral`, `circle`; `turns` 0.25–20; integer `p`,`q` 1–12; `tube` 0.002–0.4 |
| `terrain` | `type`: `hills`, `mountains`, `dunes`, `ocean`; `amp` 0–1; `freq` 0.2–40; `speed` -5–5; `seed` |
| `particles` | `type`: `stars`, `snow`, `rain`, `fireflies`, `embers`, `galaxy`, `ring`, `dust`; integer `count` 1–20000; `speed` -10–10; `seed` |

Flats lie in XY facing +Z. Cylinders and cones run along Y. Torus/curve circle rings lie in XZ; rotate around X to face the camera. Terrain spans XZ; scale X/Z for its footprint. Particles fill a unit-sized region before scaling; a seed makes the initial distribution reproducible. Terrain/particles may animate internally via their geometry speed, separately from `anim`.

## Behaviors

Object and camera `anim` arrays contain supported behavior objects. Rigid offsets add to base position/rotation and pulse/keyframe scales multiply base scale. Deformers affect the object's sampled points. Camera consumes rigid behavior channels; wave/twist have no useful camera-deformation role.

| `type` | Fields |
|---|---|
| `spin` | `axis:"x"|"y"|"z"`, `speed` degrees/sec |
| `orbit` | `radius`, `speed` degrees/sec, `tilt` degrees, `phase` degrees, `plane:"xy"|"xz"` |
| `bob` | `axis`, `amp` world units, `speed` Hz, `phase` cycles |
| `pulse` | `amp` -0.95–5, `speed` Hz, `phase` cycles; keep amplitudes small for coherent forms |
| `sway` | `axis`, `amp` degrees, `speed` Hz, `phase` cycles |
| `drift` | `vel:[x,y,z]` world units/sec, `wrap` nonnegative half-range; zero wrap produces no drift in this implementation |
| `keys` | `loop` nonnegative seconds, `ease:"smooth"|"linear"`, `keys:[{t,pos?,rot?,scale?}]`; offsets, not absolute transforms |
| `wave` | `axis`, `amp`, `freq`, `speed` Hz; periodic local surface deformation |
| `twist` | `amount` degrees per unit, `speed` Hz; twist around local Y, oscillating when speed is nonzero |

Array: `{count,offset:[x,y,z],step:[x,y,z],rot:[x,y,z],grow,spin,phase,jitter?}`. `count` 1–240; `grow` 0.2–5; `jitter` 0–1 gives deterministic per-copy Y-scale variation grown from the base. `phase` delays each copy in seconds. `rot` is per-copy rotation; `spin` is degrees/sec applied on axes whose per-copy `rot` is nonzero.

Copy i gets array rotation around `offset + i*step`, then its own object rotation/scale, then the object's world placement and animated offset. Object base scale does not scale the array offset. A 2D ring: `offset:[0,r,0]`, `rot:[0,0,360/count]`. An XZ ring: `offset:[r,0,0]`, `rot:[0,360/count,0]`. A row: `step:[spacing,0,0]`. Choose `grow:1` for equal copies.

Read [motion-and-verification.md](motion-and-verification.md) for the exact loop conditions and transform caveats.

## Fields

Field: `{id?,type,layer,charset,colors,scale,speed,intensity,angle,seed,random?,hidden?}`. Supported types: `gradient`, `plasma`, `noise`, `waves`, `ripples`, `rain`, `fire`, `aurora`, `tunnel`, `vortex`, `stars`, `metaballs`, `rings`, `grid`.

`layer:"back"` fills uncovered cells; `"front"` draws over subjects. Use front layers sparingly. `colors` is a low-to-high ramp of 2–6 valid colors (usually 2–4). `scale` 0.05–20, `speed` -20–20, `intensity` 0–1.5. `angle` means direction for directional effects and horizon height for `grid`. `seed` fixes the distribution. `random:true` picks random glyphs rather than density-ramp glyphs; rain/stars default to it, so explicitly set `random:false` when stable texture matters. Fields have no general object-space `pos`, `scale` vector, or `anim` list.

## Modeller scenes and sculpts

A minimal serialized scene is `{v:1,blend,prims:[],dabs:[]}`. Every primitive needs valid three-component `pos`, `rot`, and `scale` vectors; unlike world objects, a malformed primitive can be dropped. Use `op:"add"|"subtract"`, `color`, optional `id`. `blend` 0–0.5 controls smooth union; start at 0.04–0.12 for creatures. Sphere diameter is 1 before scale.

```json
{ "kind": "scene", "scene": {
  "v": 1, "blend": 0.08,
  "prims": [
    { "type": "sphere", "op": "add", "pos": [0, 0, 0], "rot": [0, 0, 0], "scale": [0.4, 0.9, 0.3], "color": "#ff7a2e" },
    { "type": "cone", "op": "add", "pos": [0, -0.55, 0], "rot": [0, 0, 180], "scale": [0.34, 0.32, 0.12], "color": "#fff4e6" }
  ], "dabs": []
} }
```

Dabs are `{p:[x,y,z],r,op,color}` sculpt spheres. Serialized paint and imported `mesh` prims are also supported: preserve these structures when editing an existing scene; use actual scene exports and `lib/ascii/scene.ts` for their packed data. Do not invent mesh payloads. Modeller details and import/export are documented in `docs/mesh-editor.md`.

## Configuration: every stored key by purpose

These are parser ranges, not suggested values or promises about slider endpoints. Default look/motion can affect image/text/scene sources differently from worlds. Defaults and enum authorities are `DEFAULT_CONFIG`, `RANGES`, and `ENUMS` in `lib/ascii/config.ts`. Read them if the installed renderer differs.

| Group | Keys and accepted values |
|---|---|
| Geometry | `shape`: `extrude|relief`; `maskMode`: `auto|alpha|luma|luma-invert|none`; `invertMask` boolean; `threshold` 0–1; `smooth` 0–8; `thickness`,`reliefDepth` 0–2 |
| Glyphs | `charset` nonempty ramp up to 64 cleaned code points; `fontKey`: `geist-mono|jetbrains|space|plex|system`; `fontWeight` 100–900; `cellSize` 3–64 px; `cellAspect` 0.3–4; `glyphScale` 0.2–3 |
| Color | `colorMode`: `mono|gradient|depth|source`; `fg`,`fg2`,`bg` hex colors; `transparentBg` boolean |
| Tone | `shade`: `light|image|both`; `brightness` -1–1; `contrast`,`gamma` 0.1–5; `invert` boolean; `ambient` 0–1; `depthFade` 0–1 |
| Light | `lightAzimuth` -360–360; `lightElevation` -90–90; `pointerLight` boolean |
| Grid | `gridDots` boolean; `gridChar` one cleaned glyph; `gridColor` hex; `gridOpacity` 0–1 |
| Pose | `rotX`,`rotY`,`rotZ` -360–360 degrees; `zoom` 0.05–10; `perspective` 0–1.5; `offsetX`,`offsetY` -2–2 |
| Source motion | `motion`: `static|spin|sway`; `spinX`,`spinY`,`spinZ` -720–720 degrees/sec; `swayX`,`swayY` 0–180 degrees; `swaySpeed` 0–10 (source sway uses its own clock, not world behavior Hz) |
| Interaction | `interactive`,`wheelZoom` booleans; `inertia` 0.001–0.95 |
| Effects | `waveAmp` 0–1; `waveFreq` 0–60; `waveSpeed` -20–20; `shimmer`,`scanStrength` 0–1; `scanSpeed` 0–5; `intro` 0–10 seconds |

Useful initial look: `gridDots:false`, `intro:0`, `shimmer:0`, `charset:" .:-=+*#%@"`, with explicit `bg`. Browser cell sizes 5–9 often preserve fine detail. Most worlds should use their own camera and object `anim`, not source `motion` or `rotX/Y/Z`. Global zoom/offset and look settings still influence world rendering. Worlds have their own perspective via `camera.fov`.

## Budgets and round trips

Current parser ceilings: 64 objects, 8 fields, 240 copies per array, 1500 world instances, 20000 particles per emitter, and 120000 world particle points (rain costs four per particle, arrays multiply cost). Modeller scenes cap at 256 prims and 20000 dabs. These are safety limits, not production targets. Start much smaller; a low-object world can still be expensive with dense sculpts and arrays.

Check intended values against parsed output. Save through `serializePiece`/MCP when appropriate, but inspect repairs before normalizing away evidence. Piece serialization drops config values equal to defaults, adds IDs/default fields, and rounds some transforms to four decimal places. Those changes are expected; changed enum values, missing actors, clamped counts and discarded custom properties require attention.

New scene properties require parser, serialization, studio controls, coverage and documentation together under this repo's `AGENTS.md`. Creating a piece normally needs none of those engine changes.

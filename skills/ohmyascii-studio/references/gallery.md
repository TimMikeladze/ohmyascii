# Gallery atlas

All 36 curated worlds in `lib/ascii/worlds.ts`, grouped by the construction lesson they teach. For reusable overall compositions and copyable starters, choose a [pattern](patterns.md) first; use this atlas to find supporting techniques. Retrieve full piece JSON with `get_gallery_piece({key})` or `pnpm exec tsx skills/ohmyascii-studio/scripts/inspect.ts <key> --json`. Keep each preset's config patch with its geometry: light and tone are part of the example.

Read the koi construction in [art-direction.md](art-direction.md) once. Then study the rows relevant to the request. Gallery durations are export lengths; evaluate exact looping independently.

## Organic subjects and ornament

| Key | Construction worth studying | Adaptation caution |
|---|---|---|
| `koi` | Six-prim colored fish sculpts; XY orbit + Z heading + wave; nested petal arrays; notched lily pads | Source colors belong on the sculpt object; fit must include peripheral pads and fish motion |
| `jellyfish` | Subtract spheres/box from bell; thin helix tentacle arrays; coordinated bob and local waves | Preserve attachment; simplify and thicken tentacles for short terminals; opaque renderer only suggests translucency |
| `mandala` | Three petal rings, different counts/radii/speeds; bead halo with delayed pulse | Symmetry can shorten a visual rotation period, but independent moving copies may break that symmetry |
| `reef` | Low dunes as sand; helix coral; staggered school of flat petal fish; embers as bubbles | Keep bubble brightness and coral detail below the fish hierarchy |
| `heartbeat` | Beveled extruded heart, pulse, drifting petal arrays | Pulse expands scale, not illumination; very small scale makes a shape nearly disappear |
| `pumpkin` | Squashed sphere with static rib deformation; bright flat eyes and grin near the surface | Facial features need to remain in front of the body across the chosen camera motion |

## Landscapes and atmosphere

| Key | Construction worth studying | Adaptation caution |
|---|---|---|
| `sunset` | Flat disk with blank-glyph rectangle bands; moving ocean; drifting clouds; orthographic view | Bands intentionally occlude the sun; texture and water amplitude should preserve horizon legibility |
| `aurora` | Gradient + stars + aurora fields; far/near snowy terrain; shallow lake; snow particles | Three atmosphere layers can overwhelm a small frame; do not assume noise-based motion closes |
| `zen` | Shallow high-frequency dunes; stone cluster; nested rake rings; snow particles repurposed as petals | Prioritize stone silhouette and raked texture over particle count |
| `forest` | Tiered cone pine arrays with deterministic height jitter; moon; sparse fireflies | Dark forest values must remain distinct; firefly motion has seed-dependent periods |
| `village` | Cabins assembled from walls, tilted roof planes, chimney and emissive windows; snow and pines | Many authored objects are justified here; consolidate a building into a sculpt when useful |
| `earthrise` | Foreground regolith; blue planetary body; orbiting colored land/cloud blobs | A graphic approximation of a planet, not a textured physical globe |
| `balloons` | Two-tone envelopes, small baskets, coordinated bob/sway, layered hills | Separate objects have no parent hierarchy; shared sway alone will not rotate attachments around a common pivot |
| `desert` | Dunes + crescent moon; cactus cylinders; sparse stars | Preserve loneliness through spacing rather than adding scenery |
| `summit` | One strong mountain field and snowfall against a graded sky | Great example of achieving atmosphere with few objects |
| `windmill` | Cone tower, cap, rotating flat cross sails, arrayed tulip rows | Align sail pivot with the tower; camera and vegetation stay quieter |
| `crystals` | Cone spire array with jitter; tilted hero crystal; low floor and dust | Height tint and a few highlights carry the mineral identity |

## Celestial and scientific forms

| Key | Construction worth studying | Adaptation caution |
|---|---|---|
| `orrery` | Lit sun/corona, thin curve orbit guides, planets and moons on shared paths | Keep moons attached to their moving system explicitly; independent animations are additive offsets |
| `galaxy` | Dense seeded particle arms around a small bright core; nebula-like noise | Budget particles by target size; differential particle rotation is not one common loop period |
| `dna` | Multi-strand helix, rotated rung arrays and base beads, diagonal camera composition | Rotations and per-copy transform order determine whether rungs join the strands |
| `blackhole` | Blank-glyph event horizon, bright photon ring, tilted disk and particle spray | Graphic disk/horizon layering; no gravitational lensing shader |
| `saturn` | Height-tinted giant, tilted flat rings, small orbiting moons | Ring plane and occlusion must be judged from the actual camera |
| `atom` | Nucleus pulse, repeated tilted orbit rings, three fast electrons | Distinct orbit speeds do not necessarily return at the chosen duration |
| `knot` | Parametric knot tube with two-axis rotation and a quiet vortex background | Several rotational channels must close, even for a single object |
| `eclipse` | Layered glyph-density halos, star streamers, bright bead and blank moon disk | Preserve the dark central silhouette; full-frame bright noise destroys totality |

## Urban, abstract, and action scenes

| Key | Construction worth studying | Adaptation caution |
|---|---|---|
| `campfire` | Stone ring, crossed logs, staggered petal flames, warm core, rising embers | Waves/pulses suggest flicker; emissive objects do not illuminate logs automatically |
| `warp` | Tunnel field, phased drifting rings, rotated particle streaks | Drift wraps over twice its half-range; test the seam and camera roll |
| `city` | Three depth layers of jittered box towers, rainy foreground, low wet-street ocean | Wet street suggests reflected color; it is not a real reflection render |
| `synthwave` | Banded flat sun, terrain peaks, perspective screen-space grid, orthographic camera | A back field fills uncovered cells only; use depth and placement deliberately |
| `lighthouse` | Cylinder tower and bands, cone roof, rotating triangular beam pair, ocean and rain | Beams are opaque graphic shapes; reserve contrast for lamp and tower |
| `matrix` | Random glyph rain field, text prompt, keyframed cursor scale | Halfwidth katakana is intentional Unicode; replace every relevant ramp for ASCII-only output |
| `volcano` | Dark cone and hot crater, fire field, embers, foreground plain | Control saturation and particle brightness so the crater remains readable |
| `lavalamp` | Metaball field plus warm rising particles | Metaballs are screen-space procedural forms; they are not individual editable solids |
| `tornado` | Inverted cone, twist, spin and sway, dust near ground | Deformation and rotation do different jobs; the funnel should stay connected to the ground |
| `rocket` | Cylinder body, cone nose, flat fins, descending exhaust and smoke | Repeating flight illusion uses stationary framing; keep parts together during bob |
| `ufo` | Flattened saucer/dome, cone beam, repeated small lights, corn terrain | Shared bob keeps vertical attachments aligned; the graphic beam is not volumetric light |

## Marks, typography, and look presets

Seven source presets in `lib/ascii/presets.ts` cover graphic extrusion: `starburst`, `spiral`, `rings`, `bolt`, `heart`, `hexagon`, `star`. These are `source.kind:"preset"` keys, not world keys. `koi` is a gallery world; `{kind:"preset",key:"koi"}` is not the way to embed it.

Text sources create rasterized typography and then extrude/relief it. Image sources accept supplied silhouettes or photos; hand-authored SVG is appropriate for a deliberately graphic asset. Prefer native world geometry for an animated animal or environment so its parts and materials remain editable.

Look presets and ramps in `lib/ascii/config.ts` supply useful treatments including terminal monochrome, blocks, binary, amber CRT, blueprint, and ink. Apply their value and glyph vocabulary deliberately. World's per-object material colors are authoritative; global `colorMode` does not recolor every world object. For a monochrome world, adjust object colors/shadows and field colors as well as global settings.

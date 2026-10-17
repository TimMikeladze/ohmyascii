# Overall animation patterns and starter pieces

A pattern is a composition and motion structure. A style is its visual treatment. A source kind is the renderer's storage/geometry choice. Keep those decisions distinct: an ink, neon, or porcelain treatment can apply to the same orbital composition; a logo can be an image, a preset, or a modelled scene.

Choose the closest pattern, read that card, and copy its linked starter into the user's output folder. Adapt the subject and visual language before delivery. The starters are complete valid pieces using existing engine features; their names and appearances are examples, not fields the user must keep. They carry no custom template metadata or placeholders. Keep design notes outside piece JSON.

## Choose by the requested experience

| Family | Pattern | Choose when the main experience is… | Complete starter |
|---|---|---|---|
| Subjects and lettering | [Hero turntable](#hero-turntable) | One dimensional object, mark, product-like form or supplied image | [hero-turntable.ascii.json](../assets/templates/hero-turntable.ascii.json) |
| Subjects and lettering | [Kinetic type](#kinetic-type) | Readable animated words, a title, prompt or wordmark | [kinetic-type.ascii.json](../assets/templates/kinetic-type.ascii.json) |
| Living scenes | [Creature habitat](#creature-habitat) | Recognizable actors living within a small environment | [creature-habitat.ascii.json](../assets/templates/creature-habitat.ascii.json) |
| Living scenes | [Scenic diorama](#scenic-diorama) | A place, time of day, season or weather | [scenic-diorama.ascii.json](../assets/templates/scenic-diorama.ascii.json) |
| Structured motion | [Radial ornament](#radial-ornament) | A mandala, flower, seal, rosette or geometric meditation | [radial-ornament.ascii.json](../assets/templates/radial-ornament.ascii.json) |
| Structured motion | [Orbital system](#orbital-system) | A relationship between moving bodies, rings, strands or mechanisms | [orbital-system.ascii.json](../assets/templates/orbital-system.ascii.json) |
| Atmospheres | [Particle volume](#particle-volume) | Many discrete specks forming a cloud, galaxy, snowfall or swarm | [particle-volume.ascii.json](../assets/templates/particle-volume.ascii.json) |
| Atmospheres | [Generative field](#generative-field) | A continuous living texture, glyph rain, flowing bands or liquid pattern | [generative-field.ascii.json](../assets/templates/generative-field.ascii.json) |
| Action | [Flight tunnel](#flight-tunnel) | Forward travel, speed, a portal, warp or hyperspace | [flight-tunnel.ascii.json](../assets/templates/flight-tunnel.ascii.json) |
| Action | [Staged action](#staged-action) | A recognizable subject performing an action or an ordered sequence of poses | [staged-action.ascii.json](../assets/templates/staged-action.ascii.json) |

Read only the selected card and the shared adaptation/verification notes. For a quiet website background choose an atmosphere pattern and suppress central contrast. For a character request, choose creature habitat even if it also needs rain; rain is a supporting technique. For an unfamiliar subject, classify its dominant visual behavior rather than inventing another engine mode.

## Subjects and lettering

### Hero turntable

**Use for:** an animated logo, sculptural icon, product-like silhouette, mineral, abstract object, extruded mark, or photograph rendered as a relief. **Starter:** [hero turntable](../assets/templates/hero-turntable.ascii.json). Its teal torus and warm center demonstrate a source-colored modeller scene; replace this geometry for the brief.

| Decision | Recipe |
|---|---|
| Composition | One generous silhouette with a quiet surround. Start with a three-quarter view and enough margin for the widest rotated pose. A graphic mark may need a nearly frontal pose. |
| Supported construction | Use `scene` for a model, `preset` for a built-in mark, `image` for an actual supplied asset. The starter is a two-prim `scene`, not a product mesh importer. |
| Adaptation parameters | Subject geometry or image path; width/height/depth proportions; light/shadow colors; rotation axis/speed; base pose; extrusion or relief depth; framing. |
| Motion | Slow turntable when shape discovery matters. A small sway is better for marks that must stay readable. For a 12-second pure turntable use one 30 deg/s axis and disable unrelated movement. |
| Visual checks | Silhouette recognizable at every required pose; no edge-on disappearance or crop; source colors survive; logo proportions and clearspace are intact. |

For a supplied logo, change the source to `{kind:"image",path:"mark.svg"}`, copy the real asset beside the piece, and start with `shape:"extrude"`, `maskMode:"auto"`. For a supplied photo use `shape:"relief"`, `maskMode:"none"`, `shade:"both"`, and tune `reliefDepth`. These are conditional adaptations, not requests to fabricate a missing brand asset. If the asset is absent and identity matters, ask for it.

**At 80×24:** favor one broad form; reduce tiny cutouts and surface decoration. **Useful donors:** built-in `rings`/`starburst` marks, `crystals` for material values, `knot` for a sculptural focal object.

### Kinetic type

**Use for:** an animated wordmark, terminal title, greeting, status prompt, or restrained text sting. **Starter:** [kinetic type](../assets/templates/kinetic-type.ascii.json), showing a gently rocking extruded “FLOW”.

| Decision | Recipe |
|---|---|
| Composition | Lettering is the hero. Allow space around the whole word, with a quiet background. Start with one short word or two lines. |
| Supported construction | `source.kind:"text"` for one word group; a `world` with `geom.kind:"text"` objects for independently moving words or a text/environment combination. |
| Adaptation parameters | Exact text; line breaks; font/weight; thickness; glyph ramp; foreground/shadow palette; rocking amplitude; timing; spacing through object placement if using a world. |
| Motion | Hold readable poses for most of the cycle. Use shallow sway or a gentle pulse. For staged entrances, animate world text through supported `keys`; there is no per-letter timeline property. |
| Visual checks | Every requested character survives rasterization; counters remain open; text fits at its longest/widest pose; the message remains readable in monochrome. |

The starter's source sway combines its own clocks; it is an ambient idle, not a certified fixed-duration loop. For exact timing, use world text with periodic behaviors or closed keyframes. Per-letter motion requires separate text objects, with the additional object and readability cost. Text is rendered into geometry, not printed as a crisp overlay.

**At 80×24:** use a shorter label, heavier strokes and almost no perspective. **Useful donors:** `matrix` for text integrated with a field, `heartbeat` for restrained breathing movement.

## Living scenes

### Creature habitat

**Use for:** koi ponds, aquariums, fireflies around a lantern, a bird garden, or a character within a living miniature world. **Starter:** [creature habitat](../assets/templates/creature-habitat.ascii.json), derived from the gallery koi pond. Read the full [koi study](art-direction.md#koi-pond-the-standard-of-care) when changing anatomy or adapting this structure.

| Decision | Recipe |
|---|---|
| Composition | A stable habitat anchor, one or two distinctive actors, a quiet environmental field, and a few peripheral accents. Actor paths and negative space are part of the layout. |
| Supported construction | `world` containing a coherent `sculpt` per creature; `flat` scenery for top-down views; terrain for grounded scenes; limited particles/fields for ambient life. |
| Adaptation parameters | Creature proportions and markings; actor count/size contrast; anchor type; travel path/radius; heading/phase; local deformation; palette; environmental density. |
| Motion | Primary locomotion plus smaller body/appendage movement; environment stays quieter. Use orbit + related heading for circling, or closed keyframes for a custom path. |
| Visual checks | Animals recognizable at final size; tails/fins stay attached; paths avoid sustained accidental overlap; habitat anchor stays legible; every actor remains framed. |

Preserve the koi's care, not necessarily its fish, lotus or water. A moth scene can substitute a lamp and oval flight paths; a jellyfish vignette can substitute a sculpted bell and trailing curves. Separate articulated pieces need coherent transforms; a shared sway does not create parenting.

**At 80×24:** one hero or an unequal pair, wider appendages, fewer ornaments. **Useful donors:** `koi`, `jellyfish`, `reef`, `forest`.

### Scenic diorama

**Use for:** desert nights, cozy villages, mountain lakes, city skylines, gardens, weather scenes and atmospheric landscapes. **Starter:** [scenic diorama](../assets/templates/scenic-diorama.ascii.json), derived from `desert`: dunes, a crescent and a cactus establish foreground, distance and identity.

| Decision | Recipe |
|---|---|
| Composition | Background atmosphere, distant landmark, middle-ground subject grouping, and a foreground base or edge. Set the horizon deliberately. |
| Supported construction | `world` with terrain plus simple solids/sculpts, back fields for sky and sparse front weather when needed. A diorama can be flat, 2.5D layering, or fully 3D. |
| Adaptation parameters | Horizon height; near/far scale and Z placement; landmark silhouette; terrain amplitude/frequency; time-of-day palette; weather density; camera tilt and sway. |
| Motion | Mostly stable landmarks; modest weather, vegetation sway or water motion. Move the camera only enough to reveal depth without losing the composition. |
| Visual checks | Foreground and distant layers separate; horizon remains readable; weather does not cover the landmark; objects meet the ground; camera movement does not reveal disconnected scenery. |

Implied reflections are a graphic treatment, not an engine reflection material. A “cozy” version should spend highlights on windows, lamps or another specific source of warmth rather than making every surface equally bright.

**At 80×24:** one landmark, two depth bands and little weather. **Useful donors:** `sunset`, `village`, `aurora`, `city`, `desert`, `zen`.

## Structured motion

### Radial ornament

**Use for:** lotus mandalas, rosettes, ceremonial seals, decorative suns, geometric flowers and kaleidoscope-like patterns. **Starter:** [radial ornament](../assets/templates/radial-ornament.ascii.json), derived from `mandala`.

| Decision | Recipe |
|---|---|
| Composition | Stable center, two or three repeated rings, and an optional sparse outer halo. Use a fixed frontal orthographic camera. |
| Supported construction | `world` with flat petal/star/ring geometry and radial `array` placements. General mirrored-image kaleidoscope sampling is not a built-in mode. |
| Adaptation parameters | Motif silhouette; ring count; copies per ring; radius; petal aspect; radial spacing; depth order; signed array spins; pulse amplitude/phase; alternating material families. |
| Motion | Counter-rotate rings at related rates; give the center a quieter pulse. Ring speed should preserve recognizable motifs instead of dissolving into aliasing. |
| Visual checks | Center remains identifiable; outer ring fits at peak scale; adjacent motifs separate; pulse does not erase negative space; symmetry-based loop assumptions include all per-copy animation. |

Use the ring formula `offset:[0,r,0]` and `rot:[0,0,360/count]`. Array offsets are not multiplied by the object's base scale. Increase radii or reduce motif size if rings merge. A convincing ornament comes from relationships between repeated shapes, not simply a high copy count.

**At 80×24:** two rings with roughly 6–12 broad motifs per ring. **Useful donors:** `mandala`, `koi` lotus, `eclipse` halos.

### Orbital system

**Use for:** solar systems, atoms, abstract mechanisms, satellite choreography, spinning scientific forms or motion that explains a relationship. **Starter:** [orbital system](../assets/templates/orbital-system.ascii.json), derived from `atom`.

| Decision | Recipe |
|---|---|
| Composition | A stable reference body or axis, a few distinct moving bodies, thin optional path guides, and a quiet backdrop. Perspective should clarify the relationship. |
| Supported construction | `world` with spheres/solids, ring or curve guides, `orbit` behaviors and optional repeated structural elements. Helix/curve geometry can supply DNA-like variants. |
| Adaptation parameters | Body count/sizes; radii; orbit planes/tilts; phases; angular rates; path thickness; primary axis; camera angle; material coding. |
| Motion | Choose rates by intended relationship. A moon around a moving planet needs the planet's motion plus its own offset; there is no automatic hierarchy. |
| Visual checks | Bodies actually follow the visible guides; front/back occlusion reads; the central system fits; small bodies remain visible; signed speeds and phase units are correct. |

For exact loops choose rates from `360*k/T`, including camera and internal spin. If a brief needs a physically accurate scientific diagram, establish its scientific constraints separately; the atom starter is a stylized orbital motif.

**At 80×24:** one nucleus/central body and two or three movers; use thicker path guides selectively. **Useful donors:** `atom`, `orrery`, `saturn`, `dna`.

## Atmospheres

### Particle volume

**Use for:** star clouds, galaxy arms, snowfall, drifting dust, ember swarms, fireflies, or a sparse atmospheric website background. **Starter:** [particle volume](../assets/templates/particle-volume.ascii.json), derived from `galaxy`.

| Decision | Recipe |
|---|---|
| Composition | A volume or cloud with a deliberate density envelope, one spatial gesture, and occasional brighter points. A focal galaxy and a quiet background are different treatments of this structure. |
| Supported construction | `world` with `geom.kind:"particles"`; select a supported particle type, scale its region, fix its seed and optionally add a small focal body or dim back field. |
| Adaptation parameters | Particle type/count; seed; region scale; depth; motion multiplier; glyph ramp; contrast; bright-point frequency; camera angle; optional focal center. |
| Motion | Let built-in particle motion create variety; avoid adding fast camera rotation unless travel is intentional. For exact loops, consider static particle geometry plus periodic object motion. |
| Visual checks | Individual points separate; density does not become solid noise; depth remains perceptible; brightness supports the intended focal area; frame time stays acceptable. |

For a website background, reduce bright-point count, lower field/particle contrast, and move dense groupings toward edges if the center must hold content. There is no built-in text-exclusion mask: shape the region with placement or a few emitter groups. Verify against actual foreground content when that integration is requested. For a decorative gallery galaxy, a bright core is appropriate; for a text backdrop it may compete with the page.

**At 80×24:** begin around 100–600 points and add only when visible structure benefits. The bundled starter reduces the gallery galaxy from 9000 to 1200 points; reduce it further for a quiet small-terminal background. **Useful donors:** `galaxy`, `forest`, `summit`, `crystals`.

### Generative field

**Use for:** fluid glyph textures, metaball lava, aurora curtains, rain walls, ripples, abstract waves, or low-contrast ambient texture without modeled scenery. **Starter:** [generative field](../assets/templates/generative-field.ascii.json), derived from `lavalamp`.

| Decision | Recipe |
|---|---|
| Composition | One dominant screen-space pattern with coherent value bands and a restrained palette. Add an object only when it provides a meaningful anchor. |
| Supported construction | `world` with one or a few `fields`; optional particle accent. The `objects` array can be empty for a field-only scene. |
| Adaptation parameters | Field type; scale; direction/angle where supported; speed; intensity; color stops; glyph ramp; random-glyph choice; seed; overlay role. |
| Motion | The generator supplies movement. Additional camera motion does not turn a screen-space field into a physical landscape. For exact loops inspect the particular field clock. |
| Visual checks | The pattern's large structure is readable; glyphs retain hierarchy; no accidental bright wall; overlays do not obscure a subject; motion actually changes the output. |

A rain field makes a screen-space wall; particle rain occupies a 3D region. Choose according to the composition. A vortex field gives a swirling screen texture; a knot is actual tube geometry. The broad idea “abstract” does not determine which is correct.

**At 80×24:** use larger field features and a short ramp so glyph flicker does not replace structure. **Useful donors:** `lavalamp`, `matrix`, `synthwave`, `aurora`.

## Action

### Flight tunnel

**Use for:** warp travel, racing toward a portal, passing through rings, flowing corridors and forward-motion backgrounds. **Starter:** [flight tunnel](../assets/templates/flight-tunnel.ascii.json), derived from `warp`.

| Decision | Recipe |
|---|---|
| Composition | A clear vanishing region, successive depth layers, stronger peripheral flow and enough central quiet to perceive direction. |
| Supported construction | `world` with tunnel/grid field, phased curve rings moving along Z with wrapped drift, and optional elongated particle streaks. |
| Adaptation parameters | Passage radius; ring count/spacing; depth range; drift speed/wrap; perspective; streak density/length through geometry scale; palette; camera roll amplitude. |
| Motion | Mostly forward flow; phase the repeating rings so they fill the route. Keep camera roll optional and smaller than the dominant movement. |
| Visual checks | Travel direction unambiguous; rings progress rather than blink; wrap happens outside view; central opening remains readable; speed and flash density suit the requested mood. |

Use `vel:[0,0,speed]` with nonzero `wrap`; a zero wrap currently gives no drift. Wrapped drift spans `2*wrap`, and per-copy delay uses seconds. A seamless interval requires the full field/ring/streak system to close, not just one ring completing its path.

**At 80×24:** use fewer wide rings and sparse streaks; keep the vanishing region stable. **Useful donors:** `warp`, `synthwave`, `blackhole` for portal-like ring treatment.

### Staged action

**Use for:** a rocket launching, saucer hovering, lantern being approached, a mechanism opening, or another identifiable action with a clear starting state and change. **Starter:** [staged action](../assets/templates/staged-action.ascii.json), derived from `rocket`. It demonstrates sustained launch/exhaust, not a finished multi-beat timeline.

| Decision | Recipe |
|---|---|
| Composition | Subject and support/environment remain identifiable through the action. Decide whether the camera follows the subject or the subject travels through a fixed frame. |
| Supported construction | `world` with a coherent sculpt or explicitly coordinated parts, supported effects, and `keys` behaviors when timed pose changes are necessary. |
| Adaptation parameters | Action; start/end poses; beat times; subject path; keyframe offsets; hold lengths; easing; supporting effect intensity; camera response; repeat/one-shot mode. |
| Motion | For a sequence, sketch anticipation → action → settle, then encode supported transform keys. Maintain a clear primary event. For sustained action, one expressive idle plus effects may be sufficient. |
| Visual checks | Intended action visible between frames; parts remain attached; subject stays framed or exits deliberately; holds are long enough to read; the one-shot ending or repeating seam is intentional. |

Keyframes animate position, rotation and scale offsets. They do not provide arbitrary property tracks, scene cuts, audio, timed object spawning, color fades or a multi-scene editor. Use independent closed pose channels and existing effects for a supported approximation. If the user needs a feature outside the renderer, state the limitation before promising it. The rocket starter's stationary framing suggests flight; to show actual ascent, add coherent travel to every attached part or combine the rocket into a sculpt.

**At 80×24:** one event and one support effect, with broad readable poses. **Useful donors:** `rocket`, `ufo`, `windmill`, `lighthouse`.

## Adapt a template into the user's piece

1. Copy the selected starter to a fresh `<slug>.ascii.json` in the requested folder. When using this skill from an installed mirror, locate assets relative to that skill directory. Copy referenced image assets as well if the adapted source uses them.
2. Replace the subject identity and proportions, then choose the palette, glyph materials and defining details from the brief. Use the card's adaptation parameters; preserve only structure that serves the requested result.
3. Set delivery framing and motion deliberately. Recalculate every relevant clock when an exact duration is requested; record no unsupported settings in JSON.
4. Render at the target dimensions and inspect the card's visual checks alongside the shared [verification rubric](motion-and-verification.md#acceptance-rubric). Simplify at small resolutions before adding more objects.
5. Deliver the personalized piece, verification result and playback command. Keep the bundled starter intact for later work.

For example, from the repo root:

```bash
cp skills/ohmyascii/assets/templates/creature-habitat.ascii.json ascii/moon-pond.ascii.json
bun run tsx skills/ohmyascii/scripts/inspect.ts ascii/moon-pond.ascii.json --cols 80 --rows 24 --aspect 2 --out /tmp/moon-pond-preview
```

Create the output directory first if necessary, and choose a fresh destination if it already exists. These shell paths are examples; use the user's requested destination. The starter is not the finished result: inspect and edit it before claiming the user's specific brief is complete.

## Combine patterns with one dominant structure

| Brief | Dominant pattern | Supporting technique |
|---|---|---|
| “Koi swimming around my wordmark” | Creature habitat | World text becomes the stable habitat anchor; keep fish paths clear of letter counters |
| “A planet with a drifting nebula” | Orbital system | A low-contrast field or particle volume supplies atmosphere |
| “A lotus portal we fly through” | Flight tunnel | Radial ornament supplies ring motifs; prioritize travel and center clearance |
| “A cozy snow globe with a title” | Scenic diorama | Sparse particle snow and readable world text support the miniature landscape |
| “Bioluminescent jellyfish background behind a heading” | Creature habitat | Particle atmosphere stays dim; leave composition space for the actual heading |

Compose the necessary techniques into one supported piece. Combining patterns does not mean pasting two complete worlds on top of one another. Keep a shared camera, compatible coordinate scale, one palette hierarchy and an understood total object/particle budget.

## Timing and capability boundaries

Most starters are derived from tuned gallery worlds and retain their ambient choreography. Their nominal durations are recording lengths, not seamless-loop guarantees. `hero-turntable` uses a single 30 deg/s Y spin and can close its pose over 12 seconds with the included effects settings; `kinetic-type` uses source sway with its own clocks. Verify even a mathematically closed template at the real output size.

For strict loops, use [motion-and-verification.md](motion-and-verification.md) to audit every camera, behavior, array, field, terrain and particle channel. Do not present the starter's ambient animation as tested seamless merely because it has a duration.

The supported output is a live glyph render of stored source geometry and/or fields. Hand-authored sprite-frame timelines, arbitrary per-cell drawing, video-to-ASCII playback, arbitrary shader code, audio synchronization and automatic multi-shot editing are not piece source kinds. Existing images, models, text, particles, curves and procedural fields can approximate many of those aesthetics while remaining within the editable format. Honor the actual capability boundary in the response.

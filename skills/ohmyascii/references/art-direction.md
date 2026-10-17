# Art direction: a world made of glyphs

## Translate the brief into visible decisions

Write a compact direction, for example: “Two pearl jellyfish breathe through ink-blue water, with a fixed camera, broad quiet space, and delicate trailing lines.” This is an implementation guide, not a pitch that needs approval. Follow explicit art direction over these defaults.

| User language | Visible treatment | Construction choice |
|---|---|---|
| Calm, meditative, elegant | Wide quiet regions, slow paths, small secondary movement | Fixed camera, low-amplitude sway, restrained fields |
| Playful, cozy | Rounded silhouettes, warm highlights, asymmetric pairs | Beveled flats or blended sculpt, gentle bob |
| Cinematic, monumental | Small accent against a large silhouette, foreground framing | Near/far layers, careful perspective, slow camera |
| Intricate, ornamental | Readable repeated motifs at several scales | Arrays, nested rings, sparse highlights |
| Organic, alive | Body proportions, local deformation, delayed appendages | Sculpt primitives plus wave; matched component movement |
| Neon, energetic | Saturated accents, dark separation, strong directional rhythm | Emissive accents, animated grid or rain, simple geometry |
| Ink, woodcut, etched | Limited values, textured masses, intentional blank space | Mono palette, hatch ramp, quiet background |
| Retro terminal | Few glyphs, strong silhouettes, warm phosphor | ASCII ramp, amber/green values, optional restrained scan |

When asked for “beautiful,” choose a specific treatment and make the choice visible. When given a reference image, inspect it if available and extract composition, palette, silhouettes, texture, and motion implications. Describe missing references honestly. A familiar aesthetic is a vocabulary, not a substitute for subject-specific form.

## Koi pond: the standard of care

Retrieve `get_gallery_piece({key:"koi"})` or use `inspect.ts koi --json`. Read the complete construction before adapting it. The gallery koi is an aesthetic and modelling reference; its 18-second duration does not guarantee exact closure of all effects.

### Composition and hierarchy

The fixed camera has `rot:[0,0,0]`, `fov:0`, `zoom:1`, `pan:[0,0]`. The world uses `fit:1.05`. Fish travel around a stable central lotus; two off-center pads balance the frame. The center is an anchor and the fish provide the primary action. Different fish scales and orbit radii avoid a mechanical mirror image. At wide aspect ratios the peripheral pads have space; portrait or square targets require reframing.

The pond is a back field, not a stack of decorative objects. Its cool values let orange, ivory, green, and pale pink read as an intentional family. Quiet water between subjects is part of the composition. Avoid filling every cell just because the renderer can.

### Recognizable anatomy from simple shapes

Each fish is one `sculpt` with six prims and `blend:0.08`: an elongated sphere body `[0.36,0.9,0.3]`, an inverted cone tail at `[0,-0.55,0]`, two shallow spot spheres sitting toward +Z, and two thin angled fin spheres. The silhouette carries fish identity; spots carry character. Keeping those parts inside one sculpt makes the whole fish orbit, turn, and deform together.

The first fish uses orange `#ff7a2e` and ivory `#fff4e6`; the second uses white `#f2f2f2` and dark `#1a1a1a`. `source:true` on the world object preserves sculpt colors. In a standalone `scene` piece, set `config.colorMode:"source"` instead. Small spots belong slightly above the body surface so they survive depth testing.

For another animal, identify its two or three defining proportions first: jellyfish bell and trailing arms; bird beak, wings and tail; dragon head, spine and taper. Model a readable silhouette at delivery resolution. Only then add markings. Tiny eyes that disappear at 80×24 are less valuable than the correct head-to-body ratio.

### Depth without a moving camera

The pond separates overlapping forms on Z: lotus pad `0.05`, outer petals `0.15`, inner petals `0.2`, center `0.25`. This creates readable stacking with an orthographic camera. Lily pads use `flat.type:"moon"` as a notched leaf; this is a deliberate repurposing of supported geometry.

The outer lotus uses eight petal copies, `offset:[0,0.12,0]` and `rot:[0,0,45]`. The inner lotus uses six copies with a smaller offset and scale. A tiny warm center completes the form. This is efficient detail: a few named objects produce an ornate result.

### Motion relationships

Fish combine XY orbit, Z spin, and a small X wave. Orbit supplies travel, spin keeps heading related to travel, and wave supplies body life. Different directions, phase, radius and scale make a pair of actors. Static lotus support and subtle pad sway give moving subjects something stable to move against.

For a fish pointing local +Y, an XY path `p=(r cos(a),r sin(a))` has tangent `(-sin(a),cos(a))`; positive orbit and equal positive Z spin align its +Y heading. Reversed travel needs a 180-degree heading adjustment. Check the rendered result, including any initial `rot`, rather than copying both a base flip and a phase blindly.

### Transfer the craft

| Koi decision | Transfer to another brief |
|---|---|
| Two distinct fish around a stable lotus | Two fireflies around a lantern, moons around a planet, leaves around a stone |
| One sculpt per animal | Keep rigidly attached anatomy together; separate only articulating parts |
| Six simple prims with meaningful proportions | Spend geometry on recognition, then markings |
| Water glyphs differ from fish glyphs | Treat each material as a distinct density and texture |
| Small depth offsets under a fixed camera | Build readable layering before adding camera spectacle |
| Repeated petals at two scales | Repeated windows, coral branches, leaf clusters, star rays |

Do not add a lotus, pond, or orbit to an unrelated request merely to resemble this example. Preserve the design principles while inventing the scene.

## Compose from large to small

First establish the silhouette and viewing angle. A subject should read before its surface pattern does. Use one dominant grouping and fewer supporting groupings; a pair can function as one focal system. Leave roughly one third to one half of the frame visually quiet for calm work, judged by perceived contrast rather than literal blank-cell count. A dense star field can remain quiet if it is dim.

Choose a value structure: dark atmosphere, middle-value body/environment, bright accents. Reserve the brightest dense glyphs for a small part of the frame. Protect a margin around animated extents. Check the largest scale, orbit radius, wave deformation and camera angle, not only the initial pose. Intentional crop belongs in the brief.

For 3D scenes, use silhouette overlap, scale, material contrast and depth fading to establish distance. For flat scenes, use Z offsets and value separation. A moving camera is useful only when it reveals form or follows an action.

## Color and light

Choose palette roles: background, atmospheric shadow, principal subject, secondary subject, highlight. Usually two to four hue families plus light/dark variations are sufficient. Koi's many individual hex values still form a few families. A warm focal accent against a cool environment is effective; a monochrome brief needs value and density separation instead.

| Treatment | Example role colors |
|---|---|
| Pond lacquer | Ink `#03141a`, teal `#0b3d45`, jade `#7fc46a`, vermilion `#ff7a2e`, ivory `#fff4e6` |
| Moonlit porcelain | Navy `#071126`, slate `#254560`, pearl `#e8eff5`, pale gold `#d8c18c` |
| Ink on paper | Paper `#e8e1d1`, pale gray `#b5ac9b`, charcoal `#343b3a`, ink `#141b1a` |
| Amber phosphor | Near-black `#120b05`, brown `#6b3d12`, amber `#ffc46b`, cream `#fff0c2` |
| Neon rain | Black-violet `#05030c`, violet `#35205d`, cyan `#5cf0ff`, pink `#ff6ae0` |

These are starting palettes; change them for the brief. Limit bright environmental effects so they do not compete with the subject. Use `shadow` for deliberate dark ends of material ramps, `emissive` for self-lit accents, and `tint:"height"` when an object needs a bottom-to-top color treatment. Emissive is not light emission onto nearby objects. Reflections, glow and translucency need graphic approximations; the engine has no general object opacity, bloom, refraction, or reflection material.

For a translucent creature, suggest delicacy with a carved shell, sparse glyphs, pale highlights and a dark interior. Occlusion remains opaque: do not promise physically transparent overlaps. Simulate a reflection with deliberate duplicate geometry or a suitably colored water surface only when that is sufficient for the requested image.

## Glyphs are materials

Glyphs are selected from a dark-to-bright density ramp. A leading space permits the darkest samples to disappear. Per-object ramps distinguish materials; field ramps distinguish atmosphere. Inspect the result because visual density varies by font.

| Material | Suggested ramp | Intent |
|---|---|---|
| Polished body, stone | ` .:-=+*#%@` | Broad range, firm highlights |
| Quiet water | ` .-~=~` | Horizontal rhythm without dense blocks |
| Mist, distant forms | ` .,:` | Soft, low-density presence |
| Stars, plankton | ` .+*` | Sparse points with rare bright accents |
| Foliage | ` .:;+*#` | Broken organic texture |
| Etching | ` ./\|+#` | Directional hatching; escape the backslash in JSON |
| Unicode water | ` .·-~=≈` | Finer water texture when supported |
| Blocks or braille | ` ░▒▓█` or ` ⠁⠃⠇⡇⣇⣧⣷⣿` | Explicit style choice; verify font and terminal width |

ASCII-only means printable U+0020–U+007E in every rendered charset, including objects, fields and the grid. Checking only the global ramp misses overrides. Avoid emoji and ambiguous-width glyphs for terminal scenes. When piping monochrome, color cannot distinguish an orange fish from green leaves; silhouette and glyph density must still work.

## Resolution is part of the art direction

At 80×24, use fewer appendages, broader leaves, thicker curves and larger separations. Keep important fins, stems, lines and highlights around one to two cells thick in their narrow dimension. If an element flickers between zero and one cell, widen it or remove it. Increasing `cellSize` alone does not add cells to a fixed-size terminal render.

At 96×40 or larger, add secondary markings, layered petals, restrained particles and fine highlights only after the small version reads. Browser `cellSize` controls grid density within a pixel viewport; terminal `cols`, `rows`, and `--aspect` control its output grid. Check the actual aspect ratio: studio previews commonly use square cells while terminal cells are about twice as tall as they are wide.

Finish each refinement pass with one visible improvement: a fish now reads as a fish, a tail stays attached, petals no longer merge, or the moving subject stays inside the frame.

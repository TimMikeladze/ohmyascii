# Motion, loops, and visual verification

## Choreograph three levels of movement

Primary movement expresses the subject's action: a koi swims, a windmill turns, a jellyfish contracts. Secondary movement supports it: fins flex, tentacles trail, petals rock. Environmental movement is quieter: ripples, dim dust, clouds, rain. These levels need different amplitudes and rhythms. A stationary camera often reveals the craft better than another layer of motion.

Use slow-fast relationships and phase offsets instead of making every object bob identically. Calm secondary motion often starts at 0.02–0.08 world units or 2–8 degrees, then is judged at target resolution. A small shape at 24 rows may need a larger movement to register. Keep pulse amplitude low enough to preserve anatomy and avoid negative scale.

World objects have no general parent/child transform. Multiple parts sharing a bob stay vertically aligned if their timing matches. Multiple parts sharing a sway each rotate around their own origin; this is not a rigid assembled creature. Put attached parts into a single sculpt, or calculate coherent offsets/keyframes. Arrays also have a specific transform order: read the format reference before placing limbs in a ring.

## Units and closure

`world.duration` sets the nominal recording/export interval; it does not rescale or wrap every effect. Time reaches world animations directly. Gallery scenes prioritize appearance and may jump when cut at their nominal duration.

For a requested seamless loop of length **T**, choose integer cycle counts first. Use precise numeric values, not rounded `0.083` when you mean `1/12`; JSON cannot contain arithmetic expressions. Serialize calculated numbers such as `0.08333333333333333`.

| Channel | Units | Condition over T seconds |
|---|---|---|
| `spin.speed`, `orbit.speed`, `array.spin` | Degrees per second | `speed*T = 360*k` for integer k; a proven rotational symmetry can permit less |
| `bob`, `pulse`, `sway` speed | Cycles per second (Hz) | `speed*T = k` |
| `wave.speed`, oscillating `twist.speed` | Cycles per second | `speed*T = k`; zero gives a static deformation |
| `orbit.phase` | Degrees | Initial path angle; it is not a time delay |
| `bob`/`pulse`/`sway.phase` | Cycles | Initial oscillation phase, e.g. 0.25 = quarter-cycle |
| `array.phase` | Seconds per copy | Delays each copy's animation; each underlying channel still needs closure |
| `keys.loop` | Seconds | T is an integer multiple of this loop; close every animated channel at the boundary |
| `drift` | World units per second; `wrap` is half-range | Each moving axis needs `vel[a]*T = 2*wrap*k`; hide wrap discontinuities outside the frame |

A 12-second calm loop can use 30 deg/s for one orbit, -30 deg/s for opposite travel, 1/12 Hz for slow bob, and 1/3 Hz for four body-wave cycles. In a radial flower array, 6 deg/s may look closed after fewer than 360 degrees only if the full geometry, colors and per-copy animations preserve the relevant symmetry. Default to whole turns when uncertain.

The `keys` sampler holds the last provided value until wrapping; it does not interpolate automatically from the last key to the first. For a 12-second bob path, supply equivalent positions at `t:0` and `t:12`, with the high point at `t:6`. Give every channel its own closing value. Smooth interpolation has zero segment endpoint velocity but the resulting path still needs inspection. Spin keys can use 0→360; inspect angular continuity visually.

## Fields and procedural geometry have their own clocks

Field speed is not uniformly Hz. It is a time multiplier used differently by each generator in `lib/ascii/fields.ts`. Terrain and particles have separate formulas in `lib/ascii/world-geom.ts`. Do not apply `speed*T = integer` indiscriminately.

For a strict loop, static atmosphere plus explicitly periodic object animation is the simplest dependable route. A static field is still useful behind moving subjects. If animated atmosphere is central to the request, inspect its actual formula or choose an explicitly periodic construction such as repeated moving ring objects.

| Procedural effect | Useful loop fact |
|---|---|
| `gradient` field | Independent of time |
| `ripples` and `rings` fields | Phase includes `-3*t*speed`; choose `speed = 2*pi*k/(3*T)` and `random:false` |
| `vortex` field | Phase includes `-2*t*speed`; choose `speed = pi*k/T` and `random:false` |
| Noise, fire, aurora, metaballs | Multiple clocks/noise coordinates; a neat duration does not establish closure |
| Stars/rain fields | Per-cell clocks and possibly time-dependent random glyphs; use static `speed:0` and `random:false` for dependable static atmosphere |
| Ocean/other animated terrain | Multiple waves/noise clocks; inspect the implementation or use static terrain plus periodic flats/curves |
| Particle dust, galaxy, snow, fireflies, rings | Seed/radius-dependent rates; not a single shared period |
| Particle embers | Even at geometry `speed:0`, brightness has a `t*3` term when the update runs; with speed zero no update runs and geometry stays static |

Freezing particle geometry with `geom.speed:0` and animating the containing object with a periodic `anim` is a supported workaround. It creates a moving cloud, not individually drifting particles. For many independently looped specks, use small arrayed shapes with periodic motion and staggered phase; budget their instances.

For one-shot action such as liftoff, prioritize the requested action over artificial closure. State it as a one-shot. If a requested exact loop and a required unsupported effect conflict, explain the available approximation and ask one focused question when the choice changes the result materially.

## Render a diagnostic sequence

For a loop of T seconds, inspect `0`, `T/4`, `T/2`, `3T/4`, `T-dt`, and `T`, where `dt` is approximately one playback frame. MCP allows at most six times per render call, each from 0 to 120 seconds. Render `dt` and adjacent mid-loop frames in a second call when judging seam velocity or subtle motion.

For a 12-second loop at 20 fps:

```bash
bun run tsx skills/ohmyascii/scripts/inspect.ts ascii/pond.ascii.json --cols 80 --rows 24 --aspect 2 --times 0,3,6,9,11.95,12 --out /tmp/pond-preview
bun run cli render ascii/pond.ascii.json --t 0.05 --cols 80 --rows 24 --aspect 2 --color none
bun run cli ascii/pond.ascii.json --cols 80 --rows 24 --fps 20
```

Compare 0 to T for pose/color agreement, then `T-dt → 0 → dt` for continuity of direction and speed. A loop may produce identical endpoint images and still snap because a channel holds its last key. Minor glyph changes from floating-point sampling are possible; judge the spatial pattern and rendered motion rather than inventing a universal pixel-difference cutoff. Compare the seam against ordinary adjacent-frame differences.

The helper produces `.txt` grids, a colored `.png` contact sheet, and a `.json` report in its `--out` directory. It also compares adjacent requested frames by glyph and RGB. These are diagnostic measures, not an aesthetic score or proof of looping. Review the actual images. Headless rendering disables intro, shimmer and grid dots, so check those effects in the studio if they are part of the brief. Fonts can also differ between browser and Node.

MCP text previews use the piece's configured cell aspect; they are not automatically terminal-aspect previews. Use the CLI or helper with `--aspect 2` for a terminal brief. MCP's write preview is 80×32 at one time; render the actual delivery size separately.

## Acceptance rubric

| Dimension | Observable acceptance condition |
|---|---|
| Intent | Requested subjects, action, style, palette, duration, size and output path are honored; any approximation is identified |
| Composition | Subject recognizable at final size; margins cover motion; overlaps intentional; a clear focal hierarchy survives monochrome |
| Detail/material | Anatomy stays coherent; repeated features separate; glyph and value texture distinguish materials; the scene has subject-specific details |
| Motion | Action reads over multiple frames; attachments remain attached; secondary/environment movement supports the primary action |
| Technical delivery | Piece parses; normalization changes are understood; assets resolve; no unintended skipped objects; loop claims have seam evidence; one command plays it |

When a dimension fails, name the largest defect and fix that one first. Re-read the piece before editing because a studio user may have changed it. After three unsuccessful fixes to the same symptom, stop and test the underlying assumption: geometry scale, axis convention, font width, parser repair, or which file the studio is displaying. Ask one diagnostic question only when the missing information belongs to the user.

## Troubleshooting by visible symptom

| Symptom | Likely cause | Corrective action |
|---|---|---|
| Blank output | Camera/fit wrong, all-space ramp, missing asset, hidden object | Check parser report and skipped assets; preview one bright large object with a simple ramp |
| Fish/creature reads as a blob | Defining proportions too small or too much blend | Enlarge distinctive head/tail/limb forms; reduce blend; preview silhouette before markings |
| Pale subject disappears | Shadow/background too close; sparse leading ramp; low ambient | Increase value separation, thicken shape or tune ramp/light locally |
| Flat shape vanishes when rotated | Sheet becomes edge-on | Use suitable depth or keep the camera facing the plane |
| Model markings disappear | Missing `source:true` or patches hidden inside the body | Enable sculpt source colors; raise shallow patches toward the visible surface |
| Mono world remains colorful | Global `colorMode` is not a world-wide palette override | Recolor objects, sculpt prims with source colors, and field ramps |
| Loop jumps | One channel has a different clock, keys fail to close, or drift wraps visibly | Audit all animated channels, fields and geometry; calculate closure; move wrap outside view |
| Tentacles detach | Shared phase/sway mistaken for parent transform | Combine geometry or use calculated common motion; inspect attachments at all sample times |
| Terminal proportions differ | Cell aspect mismatch | Render with `--aspect 2`; reframe and simplify at actual dimensions |
| Studio frame never updates | Wrong folder/active piece or browser disconnected | Use a headless preview; confirm file and frame age before diagnosing the art |

`validate_piece` reports useful issues but does not exhaustively flag every repaired animation value or unknown nested key. Inspect the parsed/normalized result, especially after hand-authoring new constructs. A warning about no movement can also be misleading for field-only motion; inspect actual frames rather than adding an irrelevant animation just to silence it.

---
name: ohmyascii
description: Create, art-direct, refine, and preview stylized ASCII animations, creatures, logos, models, and animated 2D or 3D worlds as ohmyascii .ascii.json pieces. Use for ASCII art animation requests, terminal scenes, studio pieces, koi-pond-inspired compositions, or edits based on .frame.txt feedback.
---

# ASCII animation studio

Create an authored miniature world: recognizable silhouettes, deliberate glyph textures, a coherent palette, and motion with a reason. The koi pond is the craft benchmark. Transfer its care to the user's subject and style.

Deliver a working `*.ascii.json` piece, inspect rendered frames, and refine visible defects before handing it over. Use the existing ohmyascii renderer; the scene remains editable in the studio and playable in the terminal.

## 1. Understand the requested experience

Extract a short working brief from the request and conversation: **subject/action; mood/style; required details; target surface and dimensions; palette/glyph restrictions; duration and loop requirement; output path**. Separate explicit constraints from your creative choices. For an edit, read the current piece first and preserve everything outside the request.

If the subject or a consequential conflict is unresolved, ask one focused question. Otherwise state a one-sentence direction and proceed. A useful request is enough authorization to create the piece; creative choices do not need an approval round. With no target specified, use a studio-friendly world, 96×40 preview, 12-second duration, and `<project>/ascii/<slug>.ascii.json`. Do not block creation on a browser folder connection. With no subject at all, ask what should be animated.

Read [art-direction.md](references/art-direction.md) for composition, style translation, material glyphs, creature construction, and the detailed koi study. Turn adjectives into visible decisions before authoring.

**Done:** the brief implies a recognizable subject, a distinct treatment, and a concrete deliverable.

## 2. Ground the design in working examples

Read the selection table in [patterns.md](references/patterns.md), then the matching pattern card. It covers ten overall animation types with complete copyable pieces: hero turntable, kinetic type, creature habitat, scenic diorama, radial ornament, orbital system, particle volume, generative field, flight tunnel, and staged action. Choose by composition and motion, then adapt the pattern's subject, palette, proportions and timing to the brief. The user can name a pattern directly; otherwise choose it without asking them to classify their idea. For an existing piece, preserve its structure unless the requested change needs another pattern.

Use [gallery.md](references/gallery.md) to find a second example only when it supplies a missing technique. On first use, inspect `koi` as the quality reference. Retrieve complete gallery JSON through MCP `get_gallery_piece`, or the bundled helper below. Borrow construction techniques; change composition, palette, anatomy, and choreography to match the brief. Templates are supported starting structures, not guaranteed seamless loops or finished user-specific artwork.

With MCP, read `studio_guide` for current engine details. Without it, read [format.md](references/format.md); in a checkout, the authorities are `lib/ascii/piece.ts`, `lib/ascii/config.ts`, `lib/ascii/world.ts`, `lib/ascii/scene.ts`, and tuned examples in `lib/ascii/worlds.ts`. The in-app AI's `{world,config}` reply is a different envelope from a piece file.

**Done:** the chosen geometry and effects exist in the renderer, with an understood reference for the hardest part.

## 3. Compose and choreograph

Choose `world` for environments or independent actors, `scene` for one sculpted object, and `image`/`text` for supplied marks or typography. Establish silhouette and framing before decorative detail. For worlds, name objects by visual role, compose background/subject/accent layers, and give materials distinct glyph ramps. Use restrained asymmetry, quiet space, and one strongest focal area unless the user requests another treatment.

Read [motion-and-verification.md](references/motion-and-verification.md) before setting speeds. Build primary action, subtle secondary movement, and quieter environmental movement. A strict seamless loop needs closure for every moving channel, including fields, arrays, geometry, and camera; `duration` alone does not provide it. Use supported approximations for unavailable effects and explain any consequential limitation.

Prefer roughly 4–14 authored objects and 1–3 fields initially; arrays and sculpt prims carry detail efficiently. These are craft budgets, not schema limits. At 80×24, enlarge defining features and simplify ornaments; verify with terminal aspect 2. Preserve explicit monochrome, ASCII-only, or static-camera constraints.

**Done:** a complete piece expresses the brief using only stored, supported properties.

## 4. Render, critique, and revise

Use the first available route:

| Available environment | Execution route |
|---|---|
| ohmyascii MCP | `validate_piece({piece: JSON-text})`, `render_piece({piece: JSON-text,times,cols,rows})`, then `write_piece({path,piece: JSON-text})`. Read tool schemas; names can be server-prefixed. MCP paths are relative to its configured root. |
| Checkout and dependencies | Use the bundled helper for parser diagnostics, text frames, colored PNG contact sheets, and gallery JSON. |
| Installed terminal CLI | `ohmyascii render <piece> --t 0 --cols 80 --rows 24 --aspect 2 --color none`; repeat at multiple times. See `docs/terminal.md` in a checkout. |
| Studio folder only | Write the piece, open it in Folder, then inspect its `.frame.txt` after roughly 2 seconds. Check the file's age. One snapshot cannot verify motion or a loop. |
| No renderer available | Deliver complete JSON and an exact preview command; explicitly say rendering is unverified. Do not claim visual inspection. |

In the checkout, run these commands from the repo root. If the skill was installed elsewhere, substitute its actual directory for `skills/ohmyascii`; `--repo` identifies the renderer checkout.

```bash
bun run tsx skills/ohmyascii/scripts/inspect.ts --list
bun run tsx skills/ohmyascii/scripts/inspect.ts koi --json
bun run tsx skills/ohmyascii/scripts/inspect.ts ascii/pond.ascii.json --cols 80 --rows 24 --aspect 2 --times 0,3,6,9,11.95,12 --out /tmp/pond-preview
```

Inspect text for silhouette and density and the colored contact sheet for hierarchy and materials. Compare ordinary motion with the seam; fix the largest visible defect, re-read the on-disk piece, edit, and render again. Parser success is insufficient: check normalization changes, skipped assets, crop, overlapping actors, broken anatomy, and target-size readability. The helper writes previews only when `--out` is supplied and never rewrites the piece.

**Done:** the brief's constraints survive parsing; actual frames demonstrate recognizable subjects and intended motion; loop claims have evidence. Read the verification reference for the acceptance rubric and troubleshooting.

## 5. Deliver something immediately playable

Return the saved piece path, one sentence describing its visual treatment, a brief factual verification result, and one playback command. Keep design analysis out of the handoff unless requested. If the studio holds the output folder, select the new piece under **Folder**; otherwise it can be opened later. Studio sliders save to the same JSON: re-read before each subsequent edit.

```bash
bun run cli ascii/pond.ascii.json --watch
```

For distribution, baking, image/text assets, browser playback, and Claude/Codex invocation, read [delivery.md](references/delivery.md). Deliver only the formats requested; use the studio for its supported video exports.

---
name: excalidraw-workflow
description: Load when building or reviewing an Excalidraw diagram. Covers quick planning before drawing, element-by-element build order so the user sees live progress, and a review checklist to catch overlaps, truncated text, and unconnected arrows before finishing.
---

# Excalidraw Workflow

## 1. Quick Grid Plan (30 seconds, saves minutes)

Before the first draw command, decide your coordinate grid. This prevents overlaps and misaligned arrows that are painful to fix mid-diagram.

**For architecture / flowcharts** — sketch this mentally:
```
Tier 1 (y=60):   Client / Entry points      (x=80, 320, 560 ...)
Tier 2 (y=200):  Gateway / Edge             (x=80, 320, 560 ...)
Tier 3 (y=340):  Services                   (x=80, 320, 560 ...)
Tier 4 (y=480):  Data stores                (x=80, 320, 560 ...)
```
Rule of thumb: 140px vertical between tiers, 240px horizontal between columns.

**For mind maps / brainstorming**: start with the center node, then radiate. Plan nothing — the structure emerges as you draw.

**Only one thing to decide before drawing**: what is the first element and where does it go? Draw it immediately.

---

## 2. Draw Element by Element — User Can Steer in Real Time

Create each element with its own `excalidraw create` call so the user sees every shape appear live and can redirect if something looks wrong.

**Order:**
1. Background zones / containers (sets the skeleton)
2. Primary nodes one by one (main shapes)
3. Arrows one by one — only after both source and target exist
4. Detail labels / annotations last

**Example — element by element:**
```bash
excalidraw create --type rectangle --id zone-backend --x 40 --y 40 --width 500 --height 400 \
  --fill "#e9ecef" --stroke-color "#868e96" --opacity 40
excalidraw viewport --fit

excalidraw create --type rectangle --id api-gw --x 80 --y 100 --width 200 --height 60 \
  --text "API Gateway" --stroke-color "#9c36b5" --fill "#eebefa"
excalidraw viewport --fit

excalidraw create --type rectangle --id db --x 80 --y 260 --width 200 --height 60 \
  --text "Database" --stroke-color "#0c8599" --fill "#99e9f2"
excalidraw viewport --fit

excalidraw create --type arrow --x 0 --y 0 --start api-gw --end db
excalidraw viewport --fit
```

> **Rule**: something must appear on canvas within your first tool call.
>
> **`excalidraw batch` is best** when you have a complete diagram ready — arrow bindings are computed across the whole set at once, giving better geometry. For live incremental drawing, use individual `create` calls.

---

## 3. Fix As You Go — Don't Save It For the End

**Before every `excalidraw create`:**
- Width big enough? `max(160, charCount * 11 + 40)`. Go wider when unsure.
- Multi-word labels: `max(160, longestWord * 11 + 80)`.
- Both shapes exist before drawing the arrow?
- At least 60px gap between this shape and its neighbors?

**Fix immediately:**
```bash
excalidraw update <id> --width 220         # text truncating
excalidraw update <id> --x 320 --y 180    # overlapping neighbor
excalidraw viewport --fit
```

**Arrow passes through a box?** Shapes were too close, or arrow wasn't bound. Delete it, increase gap, recreate with `--start <id> --end <id>`.

**Overlapping elements?** Use `excalidraw distribute` to space them evenly.

Only run `excalidraw describe` if you think something got lost or an ID is wrong — not after every element.

---

## 4. Review Before Finishing

Run this before calling the diagram done:

```bash
excalidraw describe
```
Check:
- [ ] Every shape has a label
- [ ] Every arrow connects two shapes (not floating)
- [ ] No element IDs are duplicated
- [ ] Text isn't truncated (shapes wide enough)

```bash
excalidraw viewport --fit
excalidraw screenshot --out /tmp/final.png
```
Visual check — look for:
- [ ] No overlapping shapes
- [ ] Arrow lines don't pass through boxes
- [ ] Consistent color/sizing within each tier

**Save before stopping:**
```bash
excalidraw export --out backup.excalidraw
```
Canvas state and snapshots are both in-memory — lost on server restart.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `503 No frontend client connected` | Open `http://localhost:3000` in a browser. `viewport`, `screenshot`, and `mermaid` require a live browser tab. |
| Arrow not connecting | Use `--start <id> --end <id>` — both shapes must exist before creating the arrow |
| Elements scattered / overlapping | Run `excalidraw distribute id1 id2 id3 --direction vertical` to space evenly |
| Elements lost after restart | Run `excalidraw export --out backup.excalidraw` before stopping the server |
| Fill looks sketchy/hatched | Add `--fill` color with `"fillStyle": "solid"` in batch JSON |

---
name: excalidraw-workflow
description: Load when building or reviewing an Excalidraw diagram. Covers quick planning before drawing, element-by-element build order so the user sees live progress, and a review checklist to catch overlaps, truncated text, and unconnected arrows before finishing.
---

# Excalidraw Workflow

## 1. Start Immediately — Think On the Go

**Do not reason or plan before your first draw command.** The canvas is your thinking space — ideas come out as you draw, not before.

- Pick a starting point (central node, first box, first idea) and draw it **now**
- Think of the next idea **while the current element is being created**
- Let the diagram grow organically — you don't need to know the full picture upfront
- It's fine to add, move, or adjust as you go

**For brainstorming / mind maps**: start with the center node in your first tool call, then radiate outward idea by idea. Each branch will suggest the next one.

**For architecture / flowcharts**: draw the first node you're sure about, then figure out what connects to it next.

The only thing to decide before drawing: what's the very first element? Draw it. Everything else follows.

---

## 2. Draw Element by Element — User Can Steer in Real Time

**Do not batch everything at once.** Create each element with its own `excalidraw create` call so the user sees every shape appear live and can redirect if something looks wrong.

**Order to follow:**
1. Background zones / containers first (sets the skeleton)
2. Primary nodes one by one (main shapes)
3. Arrows one by one after their shapes exist
4. Detail labels / annotations last

**Example — element by element:**
```bash
# Zone first
excalidraw create --type rectangle --id zone-backend --x 40 --y 40 --width 500 --height 400 --fill "#e9ecef" --stroke-color "#868e96" --opacity 40
excalidraw viewport --fit

# Nodes one at a time
excalidraw create --type rectangle --id api-gw --x 80 --y 100 --width 160 --height 60 --text "API Gateway" --stroke-color "#9c36b5" --fill "#eebefa"
excalidraw viewport --fit

excalidraw create --type rectangle --id db --x 80 --y 260 --width 160 --height 60 --text "Database" --stroke-color "#0c8599" --fill "#99e9f2"
excalidraw viewport --fit

# Arrows after shapes exist
excalidraw create --type arrow --x 0 --y 0 --start api-gw --end db
excalidraw viewport --fit
```

> **Rule**: something must appear on canvas within your first tool call.
> If you are still planning after 2 steps, stop — draw the first shape now.
>
> **Only use `excalidraw batch`** when elements are tightly interdependent (e.g. a group of arrows that only make sense together). For everything else, create one at a time.

---

## 3. Fix As You Go — Don't Save It For the End

Catch issues inline, right when you create each element. That's the cheapest time to fix them.

**Before every `excalidraw create`:**
- Is the width big enough? Use `max(160, charCount * 11 + 40)`. When unsure, go wider.
- For multi-word labels: `max(160, longestWord * 11 + 80)` — measure the longest word, not total length.
- Is the shape already drawn before you draw an arrow to it? If not, draw the shape first.
- Is there 60px+ gap between this shape and its neighbors?

**If something is wrong, fix it immediately:**
```bash
excalidraw update <id> --width 220   # text was truncating
excalidraw update <id> --x 320 --y 180  # overlapping another shape
excalidraw viewport --fit
```

**Arrow overline fix** — if an arrow passes through a box instead of stopping at the border:
- The shapes were probably too close, or the arrow wasn't bound with `--start`/`--end`
- Delete the arrow, increase the gap between shapes, recreate with `--start <id> --end <id>`

Only run `excalidraw describe` if you think something got lost or an ID is wrong — not after every element.

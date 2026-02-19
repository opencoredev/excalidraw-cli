---
name: excalidraw-workflow
description: >
  Load when starting, building, or reviewing any Excalidraw diagram.
  Covers quick pre-draw planning (what to decide before touching the CLI),
  progressive build order so the user sees live canvas updates instead of waiting,
  and a review checklist to catch issues before calling a diagram done.
  Trigger phrases: "draw a diagram", "create a diagram", "make a chart", "visualize this",
  "check the diagram", "review the diagram", "fix the layout", "does this look right",
  "improve the diagram", "the diagram looks wrong", "iterate on this".
  Always load alongside `excalidraw` and `excalidraw-design-guide`.
---

# Excalidraw Workflow

## 1. Plan (60 seconds max — don't over-think)

Answer these before drawing anything:

- **What are the 3–7 main entities?** Name them and assign short IDs (`api-gw`, `db`, `svc-a`)
- **What connects to what?** List the arrows mentally
- **Layout direction?** Top-to-bottom (vertical flows) or left-to-right (horizontal pipelines)
- **Any groups/zones?** Background containers that wrap related nodes

That's it. Start drawing. Refine as you go.

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

## 3. Review Before Finishing

Run this checklist before calling the diagram done:

```bash
excalidraw describe        # All expected elements present? IDs correct?
excalidraw viewport --fit  # Nothing cut off at the edges?
```

Check manually:
- [ ] **Overlap** — do any shapes overlap? Fix with updated x/y
- [ ] **Text truncation** — shape width >= `textLength * 9`? If not, widen
- [ ] **Arrow binding** — arrows connected to shapes, not floating in space?
- [ ] **Color consistency** — same-role shapes use the same stroke/fill?
- [ ] **Spacing** — at least 40px between adjacent shapes, 60px between tiers?

If anything looks off:
```bash
excalidraw update <id> --width 200   # Fix truncated text
excalidraw update <id> --x 300 --y 180  # Fix overlapping position
excalidraw viewport --fit
```

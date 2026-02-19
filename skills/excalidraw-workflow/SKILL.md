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

## 2. Build Progressively — User Sees Live Progress

Split every diagram into stages. Run `excalidraw viewport --fit` after each one so the user sees the canvas building in real time.

**Stage 1 — Structure** (draw first, always)
Background zones, swimlane containers, bounding rectangles. These set the visual skeleton.
```bash
excalidraw batch stage1.json && excalidraw viewport --fit
```

**Stage 2 — Primary nodes**
The main shapes — services, decisions, databases, actors.
```bash
excalidraw batch stage2.json && excalidraw viewport --fit
```

**Stage 3 — Connections**
All arrows. Use `"start": {"id": "..."}` / `"end": {"id": "..."}` — never raw coordinates.
```bash
excalidraw batch stage3.json
```

**Stage 4 — Details** (optional)
Secondary labels, annotations, legends, helper text.
```bash
excalidraw batch stage4.json && excalidraw viewport --fit
```

> **Rule**: something must appear on canvas within your first 1–2 tool calls.
> If you haven't drawn anything yet, stop planning and start with Stage 1.

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

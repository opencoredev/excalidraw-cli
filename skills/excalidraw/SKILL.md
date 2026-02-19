---
name: excalidraw
description: >
  Control a live Excalidraw canvas via the `excalidraw` CLI. Use when an agent needs to
  (1) draw or lay out diagrams on a live canvas, (2) create/update/delete individual elements,
  (3) batch-create complex diagrams from JSON, (4) inspect the canvas with describe or screenshot,
  (5) export/import .excalidraw files, PNG, or SVG, (6) save/restore canvas snapshots,
  (7) align, distribute, group, lock, or duplicate elements,
  (8) convert Mermaid diagrams to Excalidraw elements,
  (9) share diagrams as encrypted excalidraw.com URLs.
  Requires a running canvas server (default http://localhost:3000).
  Load `excalidraw-design-guide` when creating or styling any diagram (colors, sizing, layout).
  Load `excalidraw-workflow` when building a multi-element diagram or reviewing/iterating on one.
---

# Excalidraw Skill

## Step 0: Setup

### Load companion skills when needed
- **Drawing or styling a diagram** → load `excalidraw-design-guide` (colors, sizing, anti-patterns)
- **Building a multi-element diagram or reviewing one** → load `excalidraw-workflow` (planning, progressive drawing, review checklist)
- **Just checking status, exporting, or running a single command** → no companion skills needed

### Check if canvas is running
```bash
excalidraw status
```
Returns `{"status":"healthy","elements_count":N}` if running.

### Start canvas if not running
```bash
excalidraw serve --port 3000
```
Open `http://localhost:3000` in a browser (required for screenshot/image export).

### Install CLI (one-time)
```bash
bun add -g github:opencoredev/excalidraw-cli
```

### Global URL override
```bash
export EXCALIDRAW_URL=http://localhost:3000
```
All commands respect `EXCALIDRAW_URL`. Override per-command with `--url <url>`.

---

## ⚡ Draw Element by Element — Don't Make the User Wait

**Never batch everything into one command.** Create each element individually so the user sees every shape appear on canvas and can redirect if something is wrong.

```bash
# Each element is its own call — user sees it appear immediately
excalidraw create --type rectangle --id svc-a --x 100 --y 100 --width 160 --height 60 --text "Service A"
excalidraw viewport --fit

excalidraw create --type rectangle --id svc-b --x 100 --y 240 --width 160 --height 60 --text "Service B"
excalidraw viewport --fit

excalidraw create --type arrow --x 0 --y 0 --start svc-a --end svc-b
excalidraw viewport --fit
```

**Order**: zones/containers first → nodes one by one → arrows one by one → detail labels last.

**Rule**: something must be on canvas within your first tool call. Still planning after 2 steps? Stop — draw the first shape now.

**`excalidraw batch` is only for** tightly interdependent elements that must exist together (e.g. a set of arrows referencing shapes that don't exist yet). Everything else: one `create` at a time.

---

## Quality Gate (MANDATORY before adding more elements)

After EVERY batch of elements, run a quality check:

1. `excalidraw describe` — verify all expected elements are present with correct IDs
2. `excalidraw screenshot --out /tmp/canvas.png` — visually inspect (requires browser)
3. **Check for**: text truncation, overlapping elements, arrow crossings, cramped spacing
4. **Fix before proceeding** — never say "looks good" without verifying

### Sizing formula
- Shape width: `max(160, labelTextLength * 9)` pixels
- Shape height: 60px single-line, 80px two-line, 100px three-line
- Background zones: 50px padding on all sides around contained elements
- Arrow minimum: 80px between shapes

---

## Workflow: Draw a Diagram

### Recommended order
1. `excalidraw guide` — load design best practices
2. Plan coordinate grid on paper first (prevents overlap)
3. `excalidraw clear` — start fresh (optional)
4. `excalidraw batch diagram.json` — create all shapes and arrows at once
5. `excalidraw viewport --fit` — zoom to fit all elements
6. Run Quality Gate above

### Batch JSON format
Create a file `diagram.json`:
```json
{
  "elements": [
    {
      "id": "svc-a",
      "type": "rectangle",
      "x": 100, "y": 100,
      "width": 160, "height": 60,
      "label": {"text": "Service A"},
      "strokeColor": "#1971c2",
      "backgroundColor": "#a5d8ff"
    },
    {
      "id": "svc-b",
      "type": "rectangle",
      "x": 100, "y": 240,
      "width": 160, "height": 60,
      "label": {"text": "Service B"},
      "strokeColor": "#2f9e44",
      "backgroundColor": "#b2f2bb"
    },
    {
      "type": "arrow",
      "x": 0, "y": 0,
      "start": {"id": "svc-a"},
      "end": {"id": "svc-b"},
      "label": {"text": "HTTP"}
    }
  ]
}
```
Then run: `excalidraw batch diagram.json`

**Critical**: Use `"start": {"id": "..."}` / `"end": {"id": "..."}` to bind arrows.
**Critical**: Use `"label": {"text": "..."}` for shape text (not `"text": "..."`).
For standalone text elements (`"type": "text"`), use `"text": "..."` directly.

---

## Command Reference

### Server management
```bash
excalidraw status                       # Health check
excalidraw serve --port 3000            # Start canvas server (blocks)
excalidraw serve --port 3000 --host 0.0.0.0  # Bind to all interfaces
```

### Element CRUD
```bash
excalidraw create --type rectangle --x 100 --y 100 --width 160 --height 60 --text "Box"
excalidraw create --type arrow --x 0 --y 0 --start <id> --end <id>
excalidraw create --type text --x 50 --y 50 --text "Title" --font-size 24

excalidraw update <id> --text "New Label" --stroke-color "#e03131"
excalidraw update <id> --x 200 --y 300 --width 200 --height 80

excalidraw delete <id>
excalidraw get <id>                     # Get single element
excalidraw query                        # Get all elements
excalidraw query --type rectangle       # Filter by type
```

### Batch operations
```bash
excalidraw batch diagram.json           # From file
cat diagram.json | excalidraw batch     # From stdin
excalidraw clear                        # Remove all elements
```

### Scene I/O
```bash
excalidraw export                       # Print .excalidraw JSON to stdout
excalidraw export --out scene.excalidraw  # Write to file
excalidraw import scene.excalidraw      # Import (replaces canvas)
excalidraw import scene.excalidraw --mode merge  # Merge with existing

excalidraw snapshot v1                  # Save named snapshot
excalidraw restore v1                   # Restore snapshot
```

### Viewport & visualization
```bash
excalidraw viewport --fit               # Zoom to fit all elements
excalidraw viewport --element <id>      # Center on element
excalidraw viewport --zoom 1.5          # Set zoom level

excalidraw describe                     # List all elements (text summary)
excalidraw screenshot                   # Capture canvas (requires browser)
excalidraw screenshot --format svg --out diagram.svg
```

### Layout tools
```bash
excalidraw align id1 id2 id3 --alignment left   # Align left edges
excalidraw align id1 id2 id3 --alignment top    # Align top edges
excalidraw align id1 id2 id3 --alignment center # Center horizontally
excalidraw align id1 id2 id3 --alignment middle # Center vertically

excalidraw distribute id1 id2 id3 --direction horizontal
excalidraw distribute id1 id2 id3 --direction vertical

excalidraw group id1 id2 id3            # Group elements
excalidraw ungroup <groupId>            # Ungroup

excalidraw duplicate id1 id2 --dx 20 --dy 20
excalidraw lock id1 id2                 # Lock (prevent UI edits)
excalidraw unlock id1 id2
```

### Export & sharing
```bash
excalidraw url                          # Export as encrypted excalidraw.com URL
excalidraw mermaid diagram.mmd          # Convert Mermaid to Excalidraw
echo "graph TD; A-->B" | excalidraw mermaid
```

### Design guide
```bash
excalidraw guide                        # Print color palette, sizing, layout rules
```

---

## Element Types Reference

| Type       | Required             | Notes                                        |
|------------|----------------------|----------------------------------------------|
| rectangle  | x, y, width, height  | Use `label: {text}` for labels               |
| ellipse    | x, y, width, height  | Use `label: {text}` for labels               |
| diamond    | x, y, width, height  | Use `label: {text}` for labels               |
| text       | x, y, text           | Standalone text; use `text` not `label`      |
| arrow      | x, y                 | Bind with `start`/`end`; auto-routes edges   |
| line       | x, y, points         | Manual points array [[x,y],[x,y]]           |
| freedraw   | x, y, points         | Freehand path                                |

---

## Common Patterns

### Architecture diagram
```json
{
  "elements": [
    {"id":"zone","type":"rectangle","x":40,"y":40,"width":500,"height":400,
     "backgroundColor":"#e9ecef","strokeColor":"#868e96","opacity":50,
     "label":{"text":"Backend"}},
    {"id":"api","type":"rectangle","x":80,"y":100,"width":160,"height":60,
     "strokeColor":"#1971c2","backgroundColor":"#a5d8ff","label":{"text":"API Gateway"}},
    {"id":"db","type":"rectangle","x":80,"y":260,"width":160,"height":60,
     "strokeColor":"#0c8599","backgroundColor":"#99e9f2","label":{"text":"Database"}},
    {"type":"arrow","x":0,"y":0,"start":{"id":"api"},"end":{"id":"db"},
     "label":{"text":"SQL"}}
  ]
}
```

### Flowchart
```json
{
  "elements": [
    {"id":"start","type":"ellipse","x":160,"y":40,"width":120,"height":60,
     "strokeColor":"#2f9e44","backgroundColor":"#b2f2bb","label":{"text":"Start"}},
    {"id":"step1","type":"rectangle","x":140,"y":160,"width":160,"height":60,
     "strokeColor":"#1971c2","backgroundColor":"#a5d8ff","label":{"text":"Process Data"}},
    {"id":"decide","type":"diamond","x":140,"y":280,"width":160,"height":80,
     "strokeColor":"#e8590c","backgroundColor":"#ffd8a8","label":{"text":"Valid?"}},
    {"type":"arrow","x":0,"y":0,"start":{"id":"start"},"end":{"id":"step1"}},
    {"type":"arrow","x":0,"y":0,"start":{"id":"step1"},"end":{"id":"decide"}}
  ]
}
```

---

## Iterative Refinement Loop

```
excalidraw batch diagram.json
  → excalidraw describe          (verify elements exist with correct IDs)
  → excalidraw viewport --fit    (auto-fit view)
  → excalidraw screenshot --out /tmp/check.png   (visual check)
  → [if issues] excalidraw update <id> --width 200 --height 80
  → excalidraw screenshot --out /tmp/check2.png  (re-verify)
  → [all good] done
```

---

## Troubleshooting

- **Server unreachable**: Run `excalidraw status`. If error → `excalidraw serve --port 3000`
- **Screenshot fails**: Open `http://localhost:3000` in a browser first
- **Arrow not connecting**: Use `"start": {"id": "..."}` not coordinate points
- **Label not showing**: Use `"label": {"text": "..."}` for shapes (not `"text": "..."`)
- **Elements lost after restart**: Use `excalidraw export --out backup.excalidraw` before stopping

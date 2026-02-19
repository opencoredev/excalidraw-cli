import { Command } from 'commander';
import { out } from './api.js';

const GUIDE = `# Excalidraw Diagram Design Guide

## Color Palette

### Stroke Colors
| Name   | Hex     | Use for                    |
|--------|---------|----------------------------|
| Black  | #1e1e1e | Default text & borders     |
| Red    | #e03131 | Errors, warnings, critical |
| Green  | #2f9e44 | Success, approved, healthy |
| Blue   | #1971c2 | Primary actions, links     |
| Purple | #9c36b5 | Services, middleware       |
| Orange | #e8590c | Async, queues, events      |
| Cyan   | #0c8599 | Data stores, databases     |
| Gray   | #868e96 | Annotations, secondary     |

### Fill Colors (backgroundColor — pastel)
| Name         | Hex     | Pairs with |
|--------------|---------|------------|
| Light Red    | #ffc9c9 | #e03131    |
| Light Green  | #b2f2bb | #2f9e44    |
| Light Blue   | #a5d8ff | #1971c2    |
| Light Purple | #eebefa | #9c36b5    |
| Light Orange | #ffd8a8 | #e8590c    |
| Light Cyan   | #99e9f2 | #0c8599    |
| Light Gray   | #e9ecef | #868e96    |
| White        | #ffffff | #1e1e1e    |

## Sizing Rules
- Minimum shape: width >= 120px, height >= 60px
- Font sizes: body >= 16, titles >= 20, small labels >= 14
- Arrow length: minimum 80px between shapes
- Consistent sizing: same-role shapes = same dimensions
- Shape width formula: max(160, labelTextLength * 9)

## Layout Patterns
- Align to 20px grid; 40–80px gap between shapes
- Flow: top-to-bottom or left-to-right
- Background zones: large light-fill rectangles as layer separators
- Tier spacing: 60px vertical between tiers

## Arrow Best Practices
- Bind arrows: use \`"start": {"id": "..."}\ / \`"end": {"id": "..."}\` in JSON
- Dashed: async flows / optional paths
- Dotted: weak dependencies / annotations
- Label arrows with short text (1-2 words)
- Never let arrows cross unrelated elements — add waypoints to route around

## Anti-Patterns
1. Overlapping elements — always leave gaps
2. Cramped spacing — minimum 40px between shapes
3. Tiny fonts — never below 14px
4. Missing labels — every shape and meaningful arrow needs text
5. Flat layouts — use zones to create hierarchy
6. Too many colors — limit to 3-4 fill colors per diagram

## Recommended Drawing Order
1. Background zones (large rectangles with light fill)
2. Primary shapes (services, entities — with labels)
3. Arrows (bound to shapes by ID)
4. Annotations (standalone text, titles)
5. Refinement (align, distribute, screenshot to verify)

## Diagram Type Templates

### Architecture Diagram
- 160×80 rectangles for services, 120×60 for small components
- Different fill per layer: frontend=blue, backend=purple, data=cyan
- Solid arrows for sync calls, dashed for async/events

### Flowchart
- 140×70 rectangles for steps, 100×100 diamonds for decisions
- Top-to-bottom, 60px vertical spacing
- Green start, red end, blue process steps

### ER Diagram
- 180×40 per entity, 80px between entities
- Light-blue fill for entities, no fill for junction tables
- Arrowheads show cardinality
`;

export function guideCmd(this: Command): void {
  out({ guide: GUIDE });
}

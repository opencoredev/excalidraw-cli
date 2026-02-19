#!/usr/bin/env bun

import { Command } from 'commander';

import {
  createElementCmd,
  updateElementCmd,
  deleteElementCmd,
  getElementCmd,
  queryElementsCmd,
  batchCreateCmd,
  clearCanvasCmd,
} from './commands/elements.js';

import {
  exportSceneCmd,
  importSceneCmd,
  snapshotCmd,
  restoreCmd,
  describeCmd,
  screenshotCmd,
  viewportCmd,
  mermaidCmd,
  shareUrlCmd,
} from './commands/scene.js';

import {
  serveCmd,
  stopCmd,
  statusCmd,
} from './commands/serve.js';

import {
  alignCmd,
  distributeCmd,
  groupCmd,
  unGroupCmd,
  duplicateCmd,
  lockCmd,
  unlockCmd,
} from './commands/layout.js';

import { guideCmd } from './commands/guide.js';

const program = new Command();

program
  .name('excalidraw')
  .description('CLI for controlling a live Excalidraw canvas from AI agents and scripts')
  .version('3.0.0')
  .option(
    '--url <url>',
    'Canvas server URL (overrides EXCALIDRAW_URL env var)',
    process.env.EXCALIDRAW_URL || 'http://localhost:3000'
  );

program
  .command('serve')
  .description('Start the Excalidraw canvas server')
  .option('--port <port>', 'Port to listen on', '3000')
  .option('--host <host>', 'Host to listen on', 'localhost')
  .action(serveCmd);

program
  .command('stop')
  .description('Print instructions for stopping the canvas server')
  .action(stopCmd);

program
  .command('status')
  .description('Check if canvas server is running (calls /health)')
  .action(statusCmd);

program
  .command('create')
  .description('Create a new element on the canvas')
  .requiredOption('--type <type>', 'Element type: rectangle, ellipse, diamond, arrow, text, line, freedraw')
  .requiredOption('--x <n>', 'X position', parseFloat)
  .requiredOption('--y <n>', 'Y position', parseFloat)
  .option('--width <n>', 'Width', parseFloat)
  .option('--height <n>', 'Height', parseFloat)
  .option('--text <text>', 'Label text (shapes) or content (text elements)')
  .option('--stroke-color <color>', 'Stroke color hex e.g. #1e1e1e')
  .option('--fill <color>', 'Background fill color hex')
  .option('--stroke-width <n>', 'Stroke width', parseFloat)
  .option('--stroke-style <style>', 'solid | dashed | dotted')
  .option('--roughness <n>', 'Roughness 0–3', parseFloat)
  .option('--opacity <n>', 'Opacity 0–100', parseFloat)
  .option('--font-size <n>', 'Font size (text elements)', parseFloat)
  .option('--id <id>', 'Custom element ID (useful for arrow binding)')
  .option('--start <id>', 'Arrow start element ID (binds arrow to shape edge)')
  .option('--end <id>', 'Arrow end element ID (binds arrow to shape edge)')
  .option('--end-arrowhead <type>', 'arrow | bar | dot | triangle | none')
  .option('--start-arrowhead <type>', 'arrow | bar | dot | triangle | none')
  .action(createElementCmd);

program
  .command('update <id>')
  .description('Update properties of an existing element')
  .option('--x <n>', 'X position', parseFloat)
  .option('--y <n>', 'Y position', parseFloat)
  .option('--width <n>', 'Width', parseFloat)
  .option('--height <n>', 'Height', parseFloat)
  .option('--text <text>', 'Label or text content')
  .option('--stroke-color <color>', 'Stroke color hex')
  .option('--fill <color>', 'Background fill color hex')
  .option('--stroke-width <n>', 'Stroke width', parseFloat)
  .option('--stroke-style <style>', 'solid | dashed | dotted')
  .option('--roughness <n>', 'Roughness 0–3', parseFloat)
  .option('--opacity <n>', 'Opacity 0–100', parseFloat)
  .option('--font-size <n>', 'Font size', parseFloat)
  .action(updateElementCmd);

program
  .command('delete <id>')
  .description('Delete an element by ID')
  .action(deleteElementCmd);

program
  .command('get <id>')
  .description('Get a single element by ID')
  .action(getElementCmd);

program
  .command('query')
  .description('Query canvas elements with optional filters')
  .option('--type <type>', 'Filter by element type')
  .action(queryElementsCmd);

program
  .command('batch [file]')
  .description(
    'Batch-create elements from a JSON file or stdin. ' +
    'Format: {"elements": [...]} or a bare array. ' +
    'Arrows bind via "start": {"id": "..."} / "end": {"id": "..."}. ' +
    'Shapes use "label": {"text": "..."} for labels.'
  )
  .action(batchCreateCmd);

program
  .command('clear')
  .description('Remove all elements from the canvas')
  .action(clearCanvasCmd);

program
  .command('export')
  .description('Export canvas to .excalidraw JSON (stdout or --out file)')
  .option('--out <file>', 'Write to file instead of stdout')
  .action(exportSceneCmd);

program
  .command('import <file>')
  .description('Import a .excalidraw JSON file onto the canvas')
  .option('--mode <mode>', 'replace (clear first) | merge (append)', 'replace')
  .action(importSceneCmd);

program
  .command('snapshot <name>')
  .description('Save a named snapshot of the current canvas state')
  .action(snapshotCmd);

program
  .command('restore <name>')
  .description('Restore the canvas from a previously saved snapshot')
  .action(restoreCmd);

program
  .command('describe')
  .description('Print a structured description of all canvas elements')
  .action(describeCmd);

program
  .command('screenshot')
  .description('Export canvas as PNG/SVG image (requires browser open at canvas URL)')
  .option('--format <format>', 'png | svg', 'png')
  .option('--out <file>', 'Save image to file (outputs base64 data if omitted)')
  .action(screenshotCmd);

program
  .command('viewport')
  .description('Control canvas viewport (zoom-to-fit, center on element, manual zoom)')
  .option('--fit', 'Auto-fit all elements in view')
  .option('--element <id>', 'Center view on element')
  .option('--zoom <n>', 'Zoom level (1 = 100%)', parseFloat)
  .option('--offset-x <n>', 'Horizontal scroll offset', parseFloat)
  .option('--offset-y <n>', 'Vertical scroll offset', parseFloat)
  .action(viewportCmd);

program
  .command('mermaid [file]')
  .description('Convert a Mermaid diagram to Excalidraw (from file or stdin)')
  .action(mermaidCmd);

program
  .command('url')
  .description('Export canvas as a shareable excalidraw.com link (encrypted)')
  .action(shareUrlCmd);

program
  .command('align <ids...>')
  .description('Align elements to a common edge or axis')
  .requiredOption(
    '--alignment <alignment>',
    'left | right | center | top | bottom | middle'
  )
  .action(alignCmd);

program
  .command('distribute <ids...>')
  .description('Distribute elements evenly (requires 3+ elements)')
  .requiredOption('--direction <direction>', 'horizontal | vertical')
  .action(distributeCmd);

program
  .command('group <ids...>')
  .description('Group elements together (assigns a shared groupId)')
  .action(groupCmd);

program
  .command('ungroup <groupId>')
  .description('Remove groupId from all member elements')
  .action(unGroupCmd);

program
  .command('duplicate <ids...>')
  .description('Duplicate elements with optional position offset')
  .option('--dx <n>', 'Horizontal offset from original (default: 20)', parseFloat)
  .option('--dy <n>', 'Vertical offset from original (default: 20)', parseFloat)
  .action(duplicateCmd);

program
  .command('lock <ids...>')
  .description('Lock elements to prevent UI modification')
  .action(lockCmd);

program
  .command('unlock <ids...>')
  .description('Unlock locked elements')
  .action(unlockCmd);

program
  .command('guide')
  .description('Print the diagram design guide (colors, sizing, layout, anti-patterns)')
  .action(guideCmd);

program.parse(process.argv);

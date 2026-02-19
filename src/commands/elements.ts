import { Command } from 'commander';
import { readFileSync } from 'fs';
import { api, getCanvasUrl, out, run } from './api.js';

function buildElement(opts: Record<string, any>): Record<string, any> {
  const el: Record<string, any> = {};
  if (opts.type) el.type = opts.type;
  if (opts.x !== undefined) el.x = opts.x;
  if (opts.y !== undefined) el.y = opts.y;
  if (opts.width !== undefined) el.width = opts.width;
  if (opts.height !== undefined) el.height = opts.height;
  if (opts.text) {
    if (opts.type === 'text') {
      el.text = opts.text;
    } else {
      // shapes use label: { text }
      el.label = { text: opts.text };
    }
  }
  if (opts.strokeColor) el.strokeColor = opts.strokeColor;
  if (opts.fill) el.backgroundColor = opts.fill;
  if (opts.strokeWidth !== undefined) el.strokeWidth = opts.strokeWidth;
  if (opts.strokeStyle) el.strokeStyle = opts.strokeStyle;
  if (opts.roughness !== undefined) el.roughness = opts.roughness;
  if (opts.opacity !== undefined) el.opacity = opts.opacity;
  if (opts.fontSize !== undefined) el.fontSize = opts.fontSize;
  if (opts.id) el.id = opts.id;
  if (opts.start) el.start = { id: opts.start };
  if (opts.end) el.end = { id: opts.end };
  if (opts.endArrowhead) el.endArrowhead = opts.endArrowhead;
  if (opts.startArrowhead) el.startArrowhead = opts.startArrowhead;
  return el;
}

export async function createElementCmd(
  this: Command,
  opts: Record<string, any>
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    if (!opts.type) throw new Error('--type is required');
    if (opts.x === undefined) throw new Error('--x is required');
    if (opts.y === undefined) throw new Error('--y is required');
    const body = buildElement(opts);
    const res = await api(url, '/api/elements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    out(res);
  });
}

export async function updateElementCmd(
  this: Command,
  id: string,
  opts: Record<string, any>
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const updates: Record<string, any> = {};
    if (opts.x !== undefined) updates.x = opts.x;
    if (opts.y !== undefined) updates.y = opts.y;
    if (opts.width !== undefined) updates.width = opts.width;
    if (opts.height !== undefined) updates.height = opts.height;
    if (opts.text) {
      updates.label = { text: opts.text };
      updates.text = opts.text;
    }
    if (opts.strokeColor) updates.strokeColor = opts.strokeColor;
    if (opts.fill) updates.backgroundColor = opts.fill;
    if (opts.strokeWidth !== undefined) updates.strokeWidth = opts.strokeWidth;
    if (opts.strokeStyle) updates.strokeStyle = opts.strokeStyle;
    if (opts.roughness !== undefined) updates.roughness = opts.roughness;
    if (opts.opacity !== undefined) updates.opacity = opts.opacity;
    if (opts.fontSize !== undefined) updates.fontSize = opts.fontSize;

    const res = await api(url, `/api/elements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    out(res);
  });
}

export async function deleteElementCmd(
  this: Command,
  id: string
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, `/api/elements/${id}`, { method: 'DELETE' });
    out(res);
  });
}

export async function getElementCmd(
  this: Command,
  id: string
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, `/api/elements/${id}`);
    out(res);
  });
}

export async function queryElementsCmd(
  this: Command,
  opts: Record<string, any>
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const params = new URLSearchParams();
    if (opts.type) params.set('type', opts.type);
    const res = await api(url, `/api/elements/search?${params}`);
    out(res);
  });
}

export async function batchCreateCmd(
  this: Command,
  file: string | undefined,
  _opts: Record<string, any>
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    let raw: string;
    if (file) {
      raw = readFileSync(file, 'utf-8');
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      raw = Buffer.concat(chunks).toString('utf-8');
    }

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON input. Expected {"elements": [...]}');
    }

    const elements = Array.isArray(payload) ? payload : payload.elements;
    if (!Array.isArray(elements)) {
      throw new Error('Expected {"elements": [...]} or a bare array of elements');
    }

    const res = await api(url, '/api/elements/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ elements }),
    });
    out(res);
  });
}

export async function clearCanvasCmd(this: Command): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, '/api/elements/clear', { method: 'DELETE' });
    out(res);
  });
}

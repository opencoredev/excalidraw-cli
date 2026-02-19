import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { api, getCanvasUrl, out, run } from './api.js';

export async function exportSceneCmd(
  this: Command,
  opts: { out?: string }
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, '/api/elements');
    const scene = {
      type: 'excalidraw',
      version: 2,
      source: 'excalidraw-cli',
      elements: res.elements || [],
      appState: { viewBackgroundColor: '#ffffff', gridSize: null },
    };
    if (opts.out) {
      writeFileSync(opts.out, JSON.stringify(scene, null, 2), 'utf-8');
      out({ success: true, file: opts.out, count: scene.elements.length });
    } else {
      out(scene);
    }
  });
}

export async function importSceneCmd(
  this: Command,
  file: string,
  opts: { mode: string }
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const raw = readFileSync(file, 'utf-8');
    let scene: any;
    try {
      scene = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in ${file}`);
    }
    const elements = scene.elements || (Array.isArray(scene) ? scene : []);
    if (opts.mode === 'replace') {
      await api(url, '/api/elements/clear', { method: 'DELETE' });
    }
    const res = await api(url, '/api/elements/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ elements }),
    });
    out(res);
  });
}

export async function snapshotCmd(
  this: Command,
  name: string
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, '/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    out(res);
  });
}

export async function restoreCmd(
  this: Command,
  name: string
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const snap = await api(url, `/api/snapshots/${name}`);
    const elements = snap.snapshot?.elements || [];
    await api(url, '/api/elements/clear', { method: 'DELETE' });
    const res = await api(url, '/api/elements/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ elements }),
    });
    out({ restored: name, ...res });
  });
}

export async function describeCmd(this: Command): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, '/api/elements');
    const elements: any[] = res.elements || [];
    const lines: string[] = [`Canvas: ${elements.length} element(s)\n`];
    for (const el of elements) {
      const label = el.label?.text || el.text || '';
      const pos = `(${el.x},${el.y})`;
      const size = el.width ? ` ${el.width}×${el.height}` : '';
      const txt = label ? ` "${label}"` : '';
      lines.push(`  ${el.id}: ${el.type}${txt} at ${pos}${size}`);
    }
    out({ description: lines.join('\n'), elements });
  });
}

export async function screenshotCmd(
  this: Command,
  opts: { format: string; out?: string }
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, '/api/export/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: opts.format, background: true }),
    });
    if (opts.out && res.data) {
      const buf = Buffer.from(res.data, 'base64');
      writeFileSync(opts.out, buf);
      out({ success: true, file: opts.out, format: opts.format });
    } else {
      out(res);
    }
  });
}

export async function viewportCmd(
  this: Command,
  opts: { fit?: boolean; element?: string; zoom?: number; offsetX?: number; offsetY?: number }
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const body: any = {};
    if (opts.fit) body.scrollToContent = true;
    if (opts.element) body.scrollToElementId = opts.element;
    if (opts.zoom !== undefined) body.zoom = opts.zoom;
    if (opts.offsetX !== undefined) body.offsetX = opts.offsetX;
    if (opts.offsetY !== undefined) body.offsetY = opts.offsetY;
    const res = await api(url, '/api/viewport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    out(res);
  });
}

export async function mermaidCmd(
  this: Command,
  file: string | undefined
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    let diagram: string;
    if (file) {
      diagram = readFileSync(file, 'utf-8');
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      diagram = Buffer.concat(chunks).toString('utf-8');
    }
    const res = await api(url, '/api/elements/from-mermaid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mermaidDiagram: diagram }),
    });
    out(res);
  });
}

export async function shareUrlCmd(this: Command): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, '/api/elements');
    const elements = res.elements || [];

    const scene = {
      type: 'excalidraw',
      version: 2,
      source: 'excalidraw-cli',
      elements,
      appState: { viewBackgroundColor: '#ffffff' },
    };

    const { deflateSync } = await import('zlib');
    const { webcrypto } = await import('crypto');

    const key = await webcrypto.subtle.generateKey(
      { name: 'AES-GCM', length: 128 },
      true,
      ['encrypt', 'decrypt']
    );
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(scene));
    const compressed = deflateSync(Buffer.from(encoded));
    const encrypted = await webcrypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      compressed
    );
    const exportedKey = await webcrypto.subtle.exportKey('raw', key);
    const keyB64 = Buffer.from(exportedKey).toString('base64url');
    const ivB64 = Buffer.from(iv).toString('base64url');
    const dataB64 = Buffer.from(encrypted).toString('base64url');

    const uploadRes = await fetch('https://json.excalidraw.com/api/v2/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: `${ivB64}=${dataB64}` }),
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status}`);
    }

    const uploadData = await uploadRes.json() as any;
    const shareUrl = `https://excalidraw.com/#json=${uploadData.id},${keyB64}`;
    out({ success: true, url: shareUrl });
  });
}

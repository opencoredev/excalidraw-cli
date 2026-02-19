import { Command } from 'commander';
import { api, getCanvasUrl, out, run } from './api.js';

export async function alignCmd(
  this: Command,
  ids: string[],
  opts: { alignment: string }
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const elements: any[] = [];
    for (const id of ids) {
      const res = await api(url, `/api/elements/${id}`);
      if (res.element) elements.push(res.element);
    }
    if (elements.length < 2) throw new Error('Need at least 2 valid element IDs to align');

    const alignment = opts.alignment;
    const updates: Array<{ id: string; x?: number; y?: number }> = [];

    if (alignment === 'left') {
      const minX = Math.min(...elements.map((e) => e.x));
      elements.forEach((e) => updates.push({ id: e.id, x: minX }));
    } else if (alignment === 'right') {
      const maxRight = Math.max(...elements.map((e) => e.x + (e.width || 0)));
      elements.forEach((e) => updates.push({ id: e.id, x: maxRight - (e.width || 0) }));
    } else if (alignment === 'center') {
      const avgCenter =
        elements.reduce((s, e) => s + e.x + (e.width || 0) / 2, 0) / elements.length;
      elements.forEach((e) => updates.push({ id: e.id, x: avgCenter - (e.width || 0) / 2 }));
    } else if (alignment === 'top') {
      const minY = Math.min(...elements.map((e) => e.y));
      elements.forEach((e) => updates.push({ id: e.id, y: minY }));
    } else if (alignment === 'bottom') {
      const maxBottom = Math.max(...elements.map((e) => e.y + (e.height || 0)));
      elements.forEach((e) => updates.push({ id: e.id, y: maxBottom - (e.height || 0) }));
    } else if (alignment === 'middle') {
      const avgMiddle =
        elements.reduce((s, e) => s + e.y + (e.height || 0) / 2, 0) / elements.length;
      elements.forEach((e) => updates.push({ id: e.id, y: avgMiddle - (e.height || 0) / 2 }));
    } else {
      throw new Error(`Unknown alignment: ${alignment}`);
    }

    const results = await Promise.all(
      updates.map((u) =>
        api(url, `/api/elements/${u.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(u),
        })
      )
    );
    out({ aligned: true, alignment, count: results.length });
  });
}

export async function distributeCmd(
  this: Command,
  ids: string[],
  opts: { direction: string }
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const elements: any[] = [];
    for (const id of ids) {
      const res = await api(url, `/api/elements/${id}`);
      if (res.element) elements.push(res.element);
    }
    if (elements.length < 3) throw new Error('Need at least 3 valid element IDs to distribute');

    if (opts.direction === 'horizontal') {
      elements.sort((a, b) => a.x - b.x);
      const first = elements[0];
      const last = elements[elements.length - 1];
      const span = (last.x + (last.width || 0)) - first.x;
      const totalW = elements.reduce((s, e) => s + (e.width || 0), 0);
      const gap = (span - totalW) / (elements.length - 1);
      let cx = first.x;
      for (const el of elements) {
        await api(url, `/api/elements/${el.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: cx }),
        });
        cx += (el.width || 0) + gap;
      }
    } else {
      elements.sort((a, b) => a.y - b.y);
      const first = elements[0];
      const last = elements[elements.length - 1];
      const span = (last.y + (last.height || 0)) - first.y;
      const totalH = elements.reduce((s, e) => s + (e.height || 0), 0);
      const gap = (span - totalH) / (elements.length - 1);
      let cy = first.y;
      for (const el of elements) {
        await api(url, `/api/elements/${el.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ y: cy }),
        });
        cy += (el.height || 0) + gap;
      }
    }
    out({ distributed: true, direction: opts.direction, count: elements.length });
  });
}

export async function groupCmd(this: Command, ids: string[]): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const groupId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const results = await Promise.all(
      ids.map((id) =>
        api(url, `/api/elements/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupIds: [groupId] }),
        })
      )
    );
    out({ grouped: true, groupId, count: results.length, elementIds: ids });
  });
}

export async function unGroupCmd(this: Command, groupId: string): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, '/api/elements');
    const members: any[] = (res.elements || []).filter(
      (e: any) => Array.isArray(e.groupIds) && e.groupIds.includes(groupId)
    );
    if (members.length === 0) throw new Error(`No elements found in group ${groupId}`);
    await Promise.all(
      members.map((el) =>
        api(url, `/api/elements/${el.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupIds: el.groupIds.filter((g: string) => g !== groupId) }),
        })
      )
    );
    out({ ungrouped: true, groupId, count: members.length });
  });
}

export async function duplicateCmd(
  this: Command,
  ids: string[],
  opts: { dx?: number; dy?: number }
): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const dx = opts.dx ?? 20;
    const dy = opts.dy ?? 20;
    const created: any[] = [];
    for (const id of ids) {
      const { element } = await api(url, `/api/elements/${id}`);
      if (!element) continue;
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = element;
      const res = await api(url, '/api/elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, x: element.x + dx, y: element.y + dy }),
      });
      if (res.element) created.push(res.element);
    }
    out({ duplicated: true, count: created.length, elements: created });
  });
}

export async function lockCmd(this: Command, ids: string[]): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    await Promise.all(
      ids.map((id) =>
        api(url, `/api/elements/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locked: true }),
        })
      )
    );
    out({ locked: true, count: ids.length, elementIds: ids });
  });
}

export async function unlockCmd(this: Command, ids: string[]): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    await Promise.all(
      ids.map((id) =>
        api(url, `/api/elements/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locked: false }),
        })
      )
    );
    out({ unlocked: true, count: ids.length, elementIds: ids });
  });
}

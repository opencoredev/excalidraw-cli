/**
 * Comprehensive test suite for excalidraw-cli
 * Tests every API endpoint and key CLI commands.
 *
 * Strategy: spawn the Express server as a Bun subprocess on port 3099,
 * run all HTTP + CLI tests against it, then kill it.
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { type Subprocess } from 'bun';
import path from 'path';

const PORT = 3099;
const BASE = `http://localhost:${PORT}`;
const ROOT = path.resolve(import.meta.dir, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json() as any };
}

async function post(path: string, payload: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() as any };
}

async function put(path: string, payload: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() as any };
}

async function del(path: string) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  return { status: res.status, body: await res.json() as any };
}

async function cli(...args: string[]) {
  const proc = Bun.spawn(['bun', path.join(ROOT, 'src/cli.ts'), ...args], {
    cwd: ROOT,
    env: { ...process.env, EXCALIDRAW_URL: BASE },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  await proc.exited;
  return { stdout, stderr, exit: proc.exitCode };
}

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

let serverProc: Subprocess;

beforeAll(async () => {
  serverProc = Bun.spawn(['bun', path.join(ROOT, 'src/server.ts')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdout: 'ignore',
    stderr: 'ignore',
  });

  // Wait for the server to be ready (up to 10s)
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) break;
    } catch { /* not ready yet */ }
    await Bun.sleep(100);
  }

  // Clear any leftover state
  await del('/api/elements/clear');
});

afterAll(async () => {
  serverProc.kill();
  await serverProc.exited;
});

// ---------------------------------------------------------------------------
// Health + misc
// ---------------------------------------------------------------------------

describe('Health & system', () => {
  it('GET /health returns healthy status', async () => {
    const { status, body } = await get('/health');
    expect(status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.elements_count).toBe('number');
    expect(typeof body.websocket_clients).toBe('number');
  });

  it('GET /api/sync/status returns counts', async () => {
    const { status, body } = await get('/api/sync/status');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.elementCount).toBe('number');
    expect(body.memoryUsage).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Elements — CRUD
// ---------------------------------------------------------------------------

describe('Elements — CRUD', () => {
  let rectId: string;
  let ellipseId: string;
  let diamondId: string;
  let textId: string;

  it('POST /api/elements creates a rectangle', async () => {
    const { status, body } = await post('/api/elements', {
      type: 'rectangle',
      x: 100, y: 100,
      width: 200, height: 80,
      label: { text: 'My Box' },
      strokeColor: '#1971c2',
      backgroundColor: '#a5d8ff',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.element.type).toBe('rectangle');
    expect(body.element.id).toBeDefined();
    rectId = body.element.id;
  });

  it('POST /api/elements creates an ellipse', async () => {
    const { status, body } = await post('/api/elements', {
      type: 'ellipse', x: 400, y: 100, width: 120, height: 80,
    });
    expect(status).toBe(200);
    expect(body.element.type).toBe('ellipse');
    ellipseId = body.element.id;
  });

  it('POST /api/elements creates a diamond', async () => {
    const { status, body } = await post('/api/elements', {
      type: 'diamond', x: 600, y: 100, width: 120, height: 80,
    });
    expect(status).toBe(200);
    expect(body.element.type).toBe('diamond');
    diamondId = body.element.id;
  });

  it('POST /api/elements creates a text element', async () => {
    const { status, body } = await post('/api/elements', {
      type: 'text', x: 100, y: 250, text: 'Hello world', fontSize: 18,
    });
    expect(status).toBe(200);
    expect(body.element.type).toBe('text');
    textId = body.element.id;
  });

  it('POST /api/elements rejects invalid type', async () => {
    const { status, body } = await post('/api/elements', {
      type: 'banana', x: 0, y: 0,
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('GET /api/elements lists all elements', async () => {
    const { status, body } = await get('/api/elements');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.elements)).toBe(true);
    expect(body.count).toBeGreaterThanOrEqual(4);
  });

  it('GET /api/elements/:id returns a specific element', async () => {
    const { status, body } = await get(`/api/elements/${rectId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.element.id).toBe(rectId);
    expect(body.element.type).toBe('rectangle');
  });

  it('GET /api/elements/:id returns 404 for unknown id', async () => {
    const { status, body } = await get('/api/elements/does-not-exist');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('GET /api/elements/search filters by type', async () => {
    const { status, body } = await get('/api/elements/search?type=rectangle');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.elements.every((e: any) => e.type === 'rectangle')).toBe(true);
    expect(body.elements.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/elements/search returns nothing for unknown type', async () => {
    const { status, body } = await get('/api/elements/search?type=banana');
    expect(status).toBe(200);
    expect(body.count).toBe(0);
    expect(body.elements).toHaveLength(0);
  });

  it('PUT /api/elements/:id updates an element', async () => {
    const { status, body } = await put(`/api/elements/${rectId}`, {
      width: 300,
      label: { text: 'Updated Box' },
      strokeColor: '#e03131',
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.element.width).toBe(300);
    expect(body.element.strokeColor).toBe('#e03131');
  });

  it('PUT /api/elements/:id returns 404 for unknown id', async () => {
    const { status, body } = await put('/api/elements/does-not-exist', { width: 200 });
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('DELETE /api/elements/:id deletes an element', async () => {
    const { status, body } = await del(`/api/elements/${textId}`);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    // Confirm it's gone
    const check = await get(`/api/elements/${textId}`);
    expect(check.status).toBe(404);
  });

  it('DELETE /api/elements/:id returns 404 for unknown id', async () => {
    const { status, body } = await del('/api/elements/does-not-exist');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('DELETE /api/elements/clear removes all elements and returns count', async () => {
    const { status, body } = await del('/api/elements/clear');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.count).toBe('number');
    // Canvas should now be empty
    const after = await get('/api/elements');
    expect(after.body.count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Batch create (with arrow binding)
// ---------------------------------------------------------------------------

describe('Batch create', () => {
  beforeAll(async () => {
    await del('/api/elements/clear');
  });

  it('POST /api/elements/batch creates shapes and resolves arrow bindings', async () => {
    const { status, body } = await post('/api/elements/batch', {
      elements: [
        { id: 'svc-a', type: 'rectangle', x: 100, y: 100, width: 160, height: 60, label: { text: 'Service A' } },
        { id: 'svc-b', type: 'rectangle', x: 100, y: 240, width: 160, height: 60, label: { text: 'Service B' } },
        { type: 'arrow', x: 0, y: 0, start: { id: 'svc-a' }, end: { id: 'svc-b' }, label: { text: 'HTTP' } },
      ],
    });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.elements).toHaveLength(3);

    const arrow = body.elements.find((e: any) => e.type === 'arrow');
    expect(arrow).toBeDefined();
    // Arrow should have resolved points (not default 0,0)
    expect(Array.isArray(arrow.points)).toBe(true);
    expect(arrow.points.length).toBe(2);
    // Should have startBinding metadata
    expect(arrow.startBinding?.elementId).toBe('svc-a');
    expect(arrow.endBinding?.elementId).toBe('svc-b');
  });

  it('POST /api/elements/batch rejects non-array body', async () => {
    const { status, body } = await post('/api/elements/batch', { elements: 'not-an-array' });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('POST /api/elements/batch rejects invalid element type', async () => {
    const { status, body } = await post('/api/elements/batch', {
      elements: [{ type: 'invalid', x: 0, y: 0 }],
    });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

describe('Snapshots', () => {
  beforeAll(async () => {
    await del('/api/elements/clear');
    await post('/api/elements', { type: 'rectangle', x: 10, y: 10, width: 160, height: 60 });
  });

  it('POST /api/snapshots saves a named snapshot', async () => {
    const { status, body } = await post('/api/snapshots', { name: 'test-snap' });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.name).toBe('test-snap');
    expect(typeof body.elementCount).toBe('number');
  });

  it('POST /api/snapshots requires a name', async () => {
    const { status, body } = await post('/api/snapshots', {});
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('GET /api/snapshots lists all snapshots', async () => {
    const { status, body } = await get('/api/snapshots');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.snapshots)).toBe(true);
    expect(body.snapshots.some((s: any) => s.name === 'test-snap')).toBe(true);
  });

  it('GET /api/snapshots/:name retrieves a snapshot', async () => {
    const { status, body } = await get('/api/snapshots/test-snap');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.snapshot.name).toBe('test-snap');
    expect(Array.isArray(body.snapshot.elements)).toBe(true);
  });

  it('GET /api/snapshots/:name returns 404 for unknown name', async () => {
    const { status, body } = await get('/api/snapshots/does-not-exist');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Browser-dependent endpoints (should fail gracefully)
// ---------------------------------------------------------------------------

describe('Browser-dependent endpoints (graceful failure)', () => {
  it('POST /api/export/image → 503 when no browser connected', async () => {
    const { status, body } = await post('/api/export/image', { format: 'png', background: true });
    expect(status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error).toContain('frontend client');
  });

  it('POST /api/export/image → 400 for invalid format', async () => {
    const { status, body } = await post('/api/export/image', { format: 'gif' });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('POST /api/viewport → 503 when no browser connected', async () => {
    const { status, body } = await post('/api/viewport', { scrollToContent: true });
    expect(status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error).toContain('frontend client');
  });
});

// ---------------------------------------------------------------------------
// Mermaid endpoint
// ---------------------------------------------------------------------------

describe('Mermaid conversion', () => {
  it('POST /api/elements/from-mermaid → accepted (no browser needed for dispatch)', async () => {
    const { status, body } = await post('/api/elements/from-mermaid', {
      mermaidDiagram: 'graph TD; A-->B',
    });
    // Server accepts and broadcasts; returns 200 with the diagram echoed back
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.mermaidDiagram).toBe('graph TD; A-->B');
  });

  it('POST /api/elements/from-mermaid → 400 when diagram missing', async () => {
    const { status, body } = await post('/api/elements/from-mermaid', {});
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Layout commands — align, distribute, group, ungroup, duplicate, lock, unlock
// (tested via HTTP since layout commands call the API)
// ---------------------------------------------------------------------------

describe('Layout operations', () => {
  let idA: string;
  let idB: string;
  let idC: string;

  beforeAll(async () => {
    await del('/api/elements/clear');
    const a = await post('/api/elements', { type: 'rectangle', x: 100, y: 100, width: 160, height: 60 });
    const b = await post('/api/elements', { type: 'rectangle', x: 300, y: 100, width: 160, height: 60 });
    const c = await post('/api/elements', { type: 'rectangle', x: 500, y: 100, width: 160, height: 60 });
    idA = a.body.element.id;
    idB = b.body.element.id;
    idC = c.body.element.id;
  });

  it('align left via CLI', async () => {
    const { stdout, exit } = await cli('align', idA, idB, '--alignment', 'left');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.aligned).toBe(true);
    expect(data.alignment).toBe('left');
    // Both should now share the same x
    const a = await get(`/api/elements/${idA}`);
    const b = await get(`/api/elements/${idB}`);
    expect(a.body.element.x).toBe(b.body.element.x);
  });

  it('distribute horizontal via CLI', async () => {
    const { stdout, exit } = await cli('distribute', idA, idB, idC, '--direction', 'horizontal');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.distributed).toBe(true);
  });

  it('group via CLI', async () => {
    const { stdout, exit } = await cli('group', idA, idB);
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.grouped).toBe(true);
    expect(typeof data.groupId).toBe('string');
    // Verify elements have groupIds
    const a = await get(`/api/elements/${idA}`);
    expect(Array.isArray(a.body.element.groupIds)).toBe(true);
    expect(a.body.element.groupIds.length).toBeGreaterThan(0);
  });

  it('duplicate via CLI', async () => {
    const { stdout, exit } = await cli('duplicate', idA, '--dx', '20', '--dy', '20');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.duplicated).toBe(true);
    expect(data.count).toBe(1);
    const orig = await get(`/api/elements/${idA}`);
    const dup = data.elements[0];
    expect(dup.x).toBe(orig.body.element.x + 20);
    expect(dup.y).toBe(orig.body.element.y + 20);
  });

  it('lock via CLI', async () => {
    const { stdout, exit } = await cli('lock', idA);
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.locked).toBe(true);
    const a = await get(`/api/elements/${idA}`);
    expect(a.body.element.locked).toBe(true);
  });

  it('unlock via CLI', async () => {
    const { stdout, exit } = await cli('unlock', idA);
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.unlocked).toBe(true);
    const a = await get(`/api/elements/${idA}`);
    expect(a.body.element.locked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CLI subprocess commands
// ---------------------------------------------------------------------------

describe('CLI subcommands', () => {
  it('excalidraw --help prints usage', async () => {
    const { stdout, exit } = await cli('--help');
    expect(exit).toBe(0);
    expect(stdout).toContain('excalidraw');
    expect(stdout).toContain('serve');
    expect(stdout).toContain('create');
  });

  it('excalidraw stop prints instructions', async () => {
    const { stdout, exit } = await cli('stop');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(typeof data.message).toBe('string');
    expect(data.message.toLowerCase()).toContain('ctrl');
  });

  it('excalidraw guide prints design guide JSON', async () => {
    const { stdout, exit } = await cli('guide');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(typeof data.guide).toBe('string');
    expect(data.guide).toContain('Color Palette');
    expect(data.guide).toContain('Anti-Patterns');
  });

  it('excalidraw status returns health JSON', async () => {
    const { stdout, exit } = await cli('status');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe('healthy');
  });

  it('excalidraw create via CLI round-trips through server', async () => {
    const { stdout, exit } = await cli(
      'create', '--type', 'rectangle',
      '--x', '50', '--y', '50',
      '--width', '160', '--height', '60',
      '--text', 'CLI Box',
    );
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.success).toBe(true);
    expect(data.element.type).toBe('rectangle');
  });

  it('excalidraw query returns elements array', async () => {
    const { stdout, exit } = await cli('query');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.elements)).toBe(true);
  });

  it('excalidraw query --type filters results', async () => {
    // First ensure there's a rectangle
    await cli('create', '--type', 'rectangle', '--x', '10', '--y', '10', '--width', '100', '--height', '50');
    const { stdout, exit } = await cli('query', '--type', 'rectangle');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.elements.every((e: any) => e.type === 'rectangle')).toBe(true);
  });

  it('excalidraw describe prints canvas summary', async () => {
    const { stdout, exit } = await cli('describe');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(typeof data.description).toBe('string');
    expect(data.description).toContain('Canvas:');
    expect(Array.isArray(data.elements)).toBe(true);
  });

  it('excalidraw get <id> returns the element', async () => {
    // Create one first
    const { stdout: createOut } = await cli(
      'create', '--type', 'ellipse', '--x', '200', '--y', '200', '--width', '80', '--height', '80',
    );
    const created = JSON.parse(createOut);
    const id = created.element.id;

    const { stdout, exit } = await cli('get', id);
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.success).toBe(true);
    expect(data.element.id).toBe(id);
  });

  it('excalidraw update <id> changes properties', async () => {
    // Create element
    const { stdout: createOut } = await cli(
      'create', '--type', 'rectangle', '--x', '300', '--y', '300', '--width', '100', '--height', '50',
    );
    const id = JSON.parse(createOut).element.id;

    // Update it
    const { stdout, exit } = await cli('update', id, '--text', 'Updated', '--width', '200');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.success).toBe(true);
    expect(data.element.width).toBe(200);
  });

  it('excalidraw delete <id> removes element', async () => {
    const { stdout: createOut } = await cli(
      'create', '--type', 'rectangle', '--x', '400', '--y', '400', '--width', '100', '--height', '50',
    );
    const id = JSON.parse(createOut).element.id;

    const { stdout, exit } = await cli('delete', id);
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.success).toBe(true);

    // Confirm gone
    const { exit: e2 } = await cli('get', id);
    expect(e2).toBe(1); // exits with error
  });

  it('excalidraw snapshot and restore round-trips', async () => {
    // Clear, add an element, snapshot
    await cli('clear');
    await cli('create', '--type', 'rectangle', '--x', '10', '--y', '10', '--width', '100', '--height', '50');
    const { exit: snapExit } = await cli('snapshot', 'my-snap');
    expect(snapExit).toBe(0);

    // Clear and restore
    await cli('clear');
    const { stdout, exit: restoreExit } = await cli('restore', 'my-snap');
    expect(restoreExit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.restored).toBe('my-snap');
    expect(data.count).toBeGreaterThan(0);
  });

  it('excalidraw export --out writes a file', async () => {
    const outFile = path.join(ROOT, 'test', '_export_test.excalidraw');
    const { exit } = await cli('export', '--out', outFile);
    expect(exit).toBe(0);
    const file = Bun.file(outFile);
    expect(await file.exists()).toBe(true);
    const contents = await file.json();
    expect(contents.type).toBe('excalidraw');
    expect(Array.isArray(contents.elements)).toBe(true);
    // Cleanup
    await Bun.file(outFile).arrayBuffer(); // trigger read so file is accessible
    import('fs').then(fs => fs.promises.unlink(outFile).catch(() => {}));
  });

  it('excalidraw clear empties the canvas', async () => {
    await cli('create', '--type', 'rectangle', '--x', '0', '--y', '0', '--width', '50', '--height', '50');
    const { stdout, exit } = await cli('clear');
    expect(exit).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.success).toBe(true);
    const { stdout: qOut } = await cli('query');
    expect(JSON.parse(qOut).count).toBe(0);
  });

  it('excalidraw status errors gracefully when server is down', async () => {
    const { exit } = await cli('status', '--url', 'http://localhost:19999');
    expect(exit).toBe(1); // should exit with error code
  });
});

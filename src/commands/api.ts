export function getCanvasUrl(opts?: { url?: string }): string {
  return opts?.url || process.env.EXCALIDRAW_URL || 'http://localhost:3000';
}

export async function api<T = any>(
  baseUrl: string,
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${baseUrl}${path}`;
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    throw new Error(
      `Canvas server unreachable at ${baseUrl}. Is it running? Start it with: excalidraw serve\n${err.message}`
    );
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Unexpected response from server (status ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }

  return data as T;
}

export function out(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function fail(msg: string): never {
  console.error(JSON.stringify({ error: msg }, null, 2));
  process.exit(1);
}

export async function run(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err: any) {
    fail(err.message || String(err));
  }
}

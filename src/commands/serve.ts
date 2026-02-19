import { Command } from 'commander';
import { api, getCanvasUrl, out, run } from './api.js';

export async function serveCmd(
  this: Command,
  opts: { port: string; host: string }
): Promise<void> {
  process.env.PORT = opts.port;
  process.env.HOST = opts.host;
  console.error(`Starting Excalidraw canvas on http://${opts.host}:${opts.port} ...`);
  await import('../server.js');
}

export async function stopCmd(this: Command): Promise<void> {
  out({ message: 'Use Ctrl+C or kill the process running `excalidraw serve`.' });
}

export async function statusCmd(this: Command): Promise<void> {
  const url = getCanvasUrl(this.optsWithGlobals());
  await run(async () => {
    const res = await api(url, '/health');
    out(res);
  });
}

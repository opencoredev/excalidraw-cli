# Excalidraw CLI

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Package](https://img.shields.io/badge/GitHub_Packages-@opencoredev%2Fexcalidraw--cli-blue)](https://github.com/opencoredev/excalidraw-cli/pkgs/npm/excalidraw-cli)

Control a live Excalidraw canvas from AI agents — with a plain CLI and a loadable agent skill.

![Excalidraw CLI Demo](demo.gif)

*AI agent creates a complete architecture diagram. [Watch on YouTube](https://youtu.be/ufW78Amq5qA)*

---

## Why Not MCP?

MCP (Model Context Protocol) is a popular way to give AI agents tools. But for something like Excalidraw, it has real problems:

**Context bloat.** Every tool schema is injected into the context window on every single request — even when you're not drawing anything. A full MCP server with 20+ tools can consume thousands of tokens before the agent has done anything useful.

**Always-on processes.** MCP servers are long-running daemons. You need to manage ports, handle crashes, deal with restarts, and configure clients to connect to them. It's infrastructure overhead for what is fundamentally a creative tool.

**No selectivity.** All MCP tools are loaded all the time. You can't say "load the drawing tools only when the agent needs to draw." It's all-or-nothing.

**The CLI + skill approach solves all three:**

- **Zero context overhead when idle** — the agent skill is a markdown file that's loaded on-demand, only when the agent needs to draw. When you're not diagramming, it uses zero tokens.
- **No server to manage for the agent interface** — the canvas server is a simple Express app the agent starts with one command. The CLI itself is stateless.
- **Simple bash commands** — agents already know how to run shell commands. `excalidraw create --type rectangle --x 100 --y 100` is immediately understandable. No protocol, no schemas, no handshake.

This is the same pattern Vercel and Expo use for their agent integrations: a CLI the agent runs + a skill file that explains how to use it.

---

## How It Works

Two components:

**Canvas server** — an Express + WebSocket server that runs the Excalidraw UI and exposes a REST API. Agents start it once with `excalidraw serve`, open the URL in a browser, and watch the diagram build live.

**`excalidraw` CLI** — a Bun-native CLI that agents use to talk to the canvas server. All commands output JSON. Works from any shell.

```
agent → excalidraw create --type rectangle ... → canvas server → live browser UI
```

---

## Quick Start

### 1. Install

```bash
echo "@opencoredev:registry=https://npm.pkg.github.com" >> ~/.npmrc
bun add -g @opencoredev/excalidraw-cli
```

### 2. Start the canvas

```bash
excalidraw serve
```

Open `http://localhost:3000` in your browser.

### 3. Install the agent skill

```bash
npx skills add opencoredev/excalidraw-cli
```

This adds the `excalidraw` skill to your agent — a markdown guide with command reference, workflow patterns, and examples. Your agent loads it when it needs to draw, and ignores it otherwise.

Optional design guide (color palettes, sizing rules, diagram templates):
```bash
npx skills add opencoredev/excalidraw-cli/excalidraw-design-guide
```

### 4. Check connection

```bash
excalidraw status
```

---

## CLI Reference

All commands output JSON. Set `EXCALIDRAW_URL` env var or pass `--url` to target a different canvas.

### Server

```bash
excalidraw serve [--port 3000] [--host localhost]
excalidraw status
```

### Elements

```bash
excalidraw create --type rectangle --x 100 --y 100 --width 160 --height 60 --text "Box"
excalidraw create --type arrow --x 0 --y 0 --start <id> --end <id>
excalidraw update <id> --text "New Label" --stroke-color "#e03131"
excalidraw delete <id>
excalidraw get <id>
excalidraw query [--type rectangle]
excalidraw clear
```

### Batch create (recommended for diagrams)

```bash
excalidraw batch diagram.json
cat diagram.json | excalidraw batch
```

Batch JSON format:
```json
{
  "elements": [
    {"id":"svc-a","type":"rectangle","x":100,"y":100,"width":160,"height":60,"label":{"text":"Service A"},"strokeColor":"#1971c2","backgroundColor":"#a5d8ff"},
    {"id":"svc-b","type":"rectangle","x":100,"y":240,"width":160,"height":60,"label":{"text":"Service B"},"strokeColor":"#2f9e44","backgroundColor":"#b2f2bb"},
    {"type":"arrow","x":0,"y":0,"start":{"id":"svc-a"},"end":{"id":"svc-b"},"label":{"text":"HTTP"}}
  ]
}
```

### Scene I/O

```bash
excalidraw export [--out scene.excalidraw]
excalidraw import scene.excalidraw [--mode replace|merge]
excalidraw snapshot v1
excalidraw restore v1
excalidraw describe
```

### Viewport

```bash
excalidraw viewport --fit
excalidraw viewport --element <id>
excalidraw viewport --zoom 1.5
excalidraw screenshot [--format png|svg] [--out file.png]
```

### Layout

```bash
excalidraw align id1 id2 id3 --alignment left|right|center|top|bottom|middle
excalidraw distribute id1 id2 id3 --direction horizontal|vertical
excalidraw group id1 id2 id3
excalidraw ungroup <groupId>
excalidraw duplicate id1 id2 [--dx 20] [--dy 20]
excalidraw lock id1 id2
excalidraw unlock id1 id2
```

### Utilities

```bash
excalidraw url                        # Shareable excalidraw.com link (encrypted)
excalidraw mermaid diagram.mmd        # Convert Mermaid diagram to Excalidraw
echo "graph TD; A-->B" | excalidraw mermaid
excalidraw guide                      # Print design guide as JSON
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EXCALIDRAW_URL` | `http://localhost:3000` | Canvas server URL |

---

## Agent Skills

| Skill | Install command | What it does |
|-------|----------------|--------------|
| `excalidraw` | `npx skills add opencoredev/excalidraw-cli` | Full workflow guide, command reference, diagram patterns |
| `excalidraw-design-guide` | `npx skills add opencoredev/excalidraw-cli/excalidraw-design-guide` | Color palettes, sizing, anti-patterns, templates |

Skills live in [`skills/`](skills/) and are plain markdown — readable by humans, loadable by agents via [skills.sh](https://skills.sh).

---

## Docker

Run the canvas server in Docker:

```bash
docker-compose up -d
```

Then point the CLI at it:
```bash
EXCALIDRAW_URL=http://localhost:3000 excalidraw status
```

---

## Development

```bash
bun install
bun run src/cli.ts --help     # Run CLI directly (no build step)
bun src/server.ts             # Start canvas server directly
bun run type-check            # TypeScript check
bun run build:frontend        # Build React frontend
```

---

## Known Limitations

- **In-memory state** — restarting the server clears the canvas. Use `excalidraw export` to persist.
- **Screenshot needs a browser** — `excalidraw screenshot` requires the canvas open in a browser tab.

---

## License

MIT

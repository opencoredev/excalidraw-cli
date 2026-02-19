# Excalidraw CLI

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Package](https://img.shields.io/badge/GitHub_Packages-@opencoredev%2Fexcalidraw--cli-blue)](https://github.com/opencoredev/excalidraw-cli/pkgs/npm/excalidraw-cli)

Control a live Excalidraw canvas from AI agents using a plain CLI and a loadable agent skill.

## Install

```bash
bun add -g github:opencoredev/excalidraw-cli
```

## Quick Start

```bash
# start the canvas server
excalidraw serve

# open http://localhost:3000 in your browser, then:
excalidraw status
excalidraw create --type rectangle --x 100 --y 100 --width 160 --height 60 --text "Hello"
```

## Agent Skills

Install the skill so your agent knows how to use the CLI:

```bash
bunx skills add opencoredev/excalidraw-cli
```

Optional design guide (colors, sizing, templates):

```bash
bunx skills add opencoredev/excalidraw-cli/excalidraw-design-guide
```

Skills are plain markdown files in [`skills/`](skills/) — loaded on demand, zero overhead when not in use.

---

## Why CLI + Skill Instead of MCP

This project started as an MCP server ([yctimlin/mcp_excalidraw](https://github.com/yctimlin/mcp_excalidraw)). We rewrote it as a CLI + skill for three reasons:

| | MCP | CLI + Skill |
|---|---|---|
| Context when idle | All tool schemas always loaded | Zero — skill is loaded on demand |
| Process management | Daemon, ports, crashes to manage | Stateless CLI, nothing to babysit |
| Agent compatibility | Depends on client MCP support | Any agent with bash access |

> "Adding just the popular GitHub MCP defines 93 additional tools and swallows another 55,000 of those valuable tokens. Existing CLI tools gain all of that functionality for a token cost close to zero — because every frontier LLM knows how to use them already." — Simon Willison, [simonwillison.net, Aug 2025](https://simonwillison.net/2025/Aug/22/too-many-mcps/)

The numbers back it up: the Playwright MCP server alone eats **22.2% of Claude's 200K context window** just to list its tools ([demiliani.com](https://demiliani.com/2025/09/04/model-context-protocol-and-the-too-many-tools-problem/)). Three MCP servers together consume **over 20%** before any work starts ([EclipseSource](https://eclipsesource.com/blogs/2026/01/22/mcp-context-overload/)). The problem is acknowledged at the protocol level — Huawei engineers filed a formal spec proposal to fix it in the MCP repo itself ([#1576](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1576)).

The canvas server still runs as a simple Express app. The difference is the agent interface — instead of tool schemas loaded into context on every request, it's bash commands the agent runs when needed, guided by a skill file it loads on demand.

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

| Skill | Install | What it does |
|-------|---------|--------------|
| `excalidraw` | `bunx skills add opencoredev/excalidraw-cli` | CLI workflow guide, command reference, diagram patterns |
| `excalidraw-design-guide` | `bunx skills add opencoredev/excalidraw-cli/excalidraw-design-guide` | Color palettes, sizing, anti-patterns, templates |

Skills live in [`skills/`](skills/) — plain markdown, installable via [skills.sh](https://skills.sh).

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

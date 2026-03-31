# RunDida MCP Server

MCP server for [RunDida](https://rundida.com) — 8 tools providing AI agents access to 90+ running calculators and 29 marathon events.

## Architecture

- **Single file**: `index.js` (341 lines, Node.js ES module)
- **NPM**: `@rundida/mcp-server`
- **Registry**: `io.github.XWeaponX7/rundida-mcp`
- **Data source**: All data fetched from `https://rundida.com/api/` with 30-min cache
- **Compute tools**: Pace, race prediction (Riegel + Jack Daniels VO2max), HR zones (Karvonen) — run locally, zero latency

## Files

| File | Purpose |
|------|---------|
| `index.js` | MCP server source (single file) |
| `package.json` | NPM config, `mcpName` for registry |
| `server.json` | Official MCP Registry metadata |
| `README.md` | NPM + GitHub face (promotes rundida.com) |
| `LICENSE` | MIT |
| `CHANGELOG.md` | Version history |

## Version Sync (3 places)

When bumping version, update ALL THREE:
1. `package.json` → `"version": "X.Y.Z"`
2. `server.json` → `"version"` + `packages[0].version`
3. `index.js` → `new McpServer({ version: 'X.Y.Z' })`

## Publish Flow

```bash
npm publish --access public     # NPM (may need browser 2FA)
mcp-publisher publish           # Official MCP Registry
git add . && git commit && git push  # GitHub
```

## Important

- This repo is typically operated from the main RunDida project (`~/Desktop/Projects/rundida/`) via cross-directory commands
- The main project's `CLAUDE.md` has the authoritative MCP workflow documentation
- Changes here should also be committed to this repo's GitHub (public facing)

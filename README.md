# @rundida/mcp-server

MCP server providing 86 running calculators, marathon data, and training tools for AI agents.

Browse running tools, look up marathon events with weather and course data, calculate pace/time/distance, predict race times, and compute heart rate training zones — all from your AI assistant.

## Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rundida": {
      "command": "npx",
      "args": ["-y", "@rundida/mcp-server"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add rundida -- npx -y @rundida/mcp-server
```

### Cursor / Windsurf

Add to your MCP configuration:

```json
{
  "rundida": {
    "command": "npx",
    "args": ["-y", "@rundida/mcp-server"]
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_tools` | Browse all 86 running calculators with descriptions |
| `get_tool` | Get details, FAQs, and sources for a specific tool |
| `list_marathons` | List upcoming marathon events with dates and locations |
| `get_marathon` | Get marathon details including weather and course profile |
| `calculate_pace` | Calculate pace, time, or distance (provide any 2 of 3) |
| `predict_race` | Predict race times using Riegel formula + VO2max estimation |
| `heart_rate_zones` | Calculate 5 HR training zones (Karvonen method) |
| `marathon_countdown` | Get countdown to a specific marathon event |

## Example Usage

Ask your AI assistant:

- "What's my marathon pace if I want to finish in 3:30?"
- "Predict my marathon time based on my 10K of 45 minutes"
- "What are my heart rate zones? I'm 32 with a resting HR of 52"
- "How many days until the Tokyo Marathon?"
- "Show me all running calculators related to nutrition"

## How It Works

- **Data tools** (`list_tools`, `get_tool`, `list_marathons`, `get_marathon`) fetch data from the [RunDida API](https://rundida.com/api/) with 30-minute caching.
- **Calculation tools** (`calculate_pace`, `predict_race`, `heart_rate_zones`) perform all computations locally using established running science formulas:
  - **Riegel formula** for race time prediction
  - **Jack Daniels method** for VO2max estimation
  - **Karvonen method** for heart rate training zones

## Requirements

- Node.js >= 18
- Internet connection (fetches data from rundida.com)

## Related

- [RunDida](https://rundida.com) — 86 interactive running calculators
- [API Documentation](https://rundida.com/api/) — Free JSON API for running data
- [OpenAPI Spec](https://rundida.com/api/openapi.json) — Machine-readable API documentation
- [GitHub](https://github.com/XWeaponX7/rundida-mcp) — Source code

## License

MIT

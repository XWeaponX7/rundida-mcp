# @rundida/mcp-server

MCP server for [**RunDida**](https://rundida.com) — the world's most comprehensive running tools platform.

Give your AI assistant access to 90+ running calculators, 29 marathon events, pace/time/distance calculations, race time predictions, and heart rate training zones.

[![Website](https://img.shields.io/badge/RunDida.com-90%2B%20Running%20Tools-blue)](https://rundida.com)
[![npm](https://img.shields.io/npm/v/@rundida/mcp-server)](https://www.npmjs.com/package/@rundida/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

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

| Tool | Type | Description |
|------|------|-------------|
| `list_tools` | Data | Browse all [90+ running calculators](https://rundida.com) with descriptions |
| `get_tool` | Data | Get details, FAQs, and sources for a specific tool |
| `list_marathons` | Data | List [29 marathon events](https://rundida.com/marathon/) with dates and locations |
| `get_marathon` | Data | Get marathon details including weather and course profile |
| `calculate_pace` | Compute | Calculate pace, time, or distance (provide any 2 of 3) |
| `predict_race` | Compute | Predict race times using Riegel formula + VO2max estimation |
| `heart_rate_zones` | Compute | Calculate 5 HR training zones (Karvonen method) |
| `marathon_countdown` | Compute | Get countdown to a specific marathon event |

**Data tools** fetch from the [RunDida API](https://rundida.com/api/) with 30-minute caching. **Compute tools** run locally with zero latency — no API calls needed.

## Example Usage

Ask your AI assistant:

- "What's my marathon pace if I want to finish in 3:30?"
- "Predict my marathon time based on my 10K of 45 minutes"
- "What are my heart rate zones? I'm 32 with a resting HR of 52"
- "How many days until the Tokyo Marathon?"
- "Show me all running calculators related to nutrition"

## About RunDida

[**RunDida**](https://rundida.com) (跑滴答) is a free running tools platform for runners of all levels:

- **[90+ Interactive Calculators](https://rundida.com)** — Pace, heart rate zones, VO2max, race prediction, nutrition, gear sizing, weather impact, and more
- **[29 Marathon Countdowns](https://rundida.com/marathon/)** — Live timers with race-day weather forecasts, course profiles, and training tools
- **[Free JSON API](https://rundida.com/api/)** — No authentication required, CORS enabled, [OpenAPI 3.0 documented](https://rundida.com/api/openapi.json)
- **Multi-language** — English, Chinese (中文)
- **Embeddable Widgets** — One-line iframe embed for any calculator

All tools are free, no account required. Try them at [rundida.com](https://rundida.com).

## How It Works

The computation tools use established running science formulas:

| Formula | Used In | Description |
|---------|---------|-------------|
| **Riegel formula** | `predict_race` | Race time prediction across distances |
| **Jack Daniels method** | `predict_race` | VO2max estimation from race performance |
| **Karvonen method** | `heart_rate_zones` | Heart rate training zones from age and resting HR |

## Requirements

- Node.js >= 18
- Internet connection (data tools fetch from [rundida.com](https://rundida.com))

## Links

| Resource | URL |
|----------|-----|
| **RunDida Website** | [rundida.com](https://rundida.com) |
| **API Documentation** | [rundida.com/api](https://rundida.com/api/) |
| **OpenAPI Spec** | [rundida.com/api/openapi.json](https://rundida.com/api/openapi.json) |
| **NPM Package** | [@rundida/mcp-server](https://www.npmjs.com/package/@rundida/mcp-server) |

## License

MIT

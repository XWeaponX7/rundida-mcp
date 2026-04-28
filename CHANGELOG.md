# Changelog

## 1.2.1 (2026-04-28)

- Fix: `marathon_countdown` returned `NaN days, NaN hours` for dates with time+timezone (e.g. `2027-03-07T09:10:00+09:00`)

## 1.2.0 (2026-04-12)

- Add guide tools: `list_guides`, `get_guide`
- Update content counts

## 1.1.0 (2026-03-28)

- Add slug-based queries and tier display

## 1.0.0 (2026-03-22)

- Initial public release
- 8 MCP tools: list_tools, get_tool, list_marathons, get_marathon, calculate_pace, predict_race, heart_rate_zones, marathon_countdown
- Data tools fetch from rundida.com API with 30-minute caching
- Computation tools (pace, race prediction, HR zones) run locally with zero latency
- No API key required

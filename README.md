<!-- prettier-ignore -->
<div align="center">

# Open-Meteo MCP Server

*Give any LLM accurate weather data: forecasts, history back to 1940, air quality, marine conditions, floods and climate projections.*

[![npm version](https://img.shields.io/npm/v/open-meteo-mcp-server?style=flat-square)](https://www.npmjs.com/package/open-meteo-mcp-server)
[![CI](https://img.shields.io/github/actions/workflow/status/cmer81/open-meteo-mcp/ci.yml?style=flat-square&label=CI)](https://github.com/cmer81/open-meteo-mcp/actions)
[![Docker image](https://img.shields.io/badge/docker-ghcr.io-2496ed?style=flat-square&logo=docker&logoColor=white)](https://github.com/cmer81/open-meteo-mcp/pkgs/container/open-meteo-mcp)
[![Node.js](https://img.shields.io/badge/Node.js->=22-3c873a?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Features](#features) • [Getting started](#getting-started) • [Tools](#tools) • [Remote deployment](#remote-deployment) • [Configuration](#configuration) • [Development](#development)

</div>

A [Model Context Protocol](https://modelcontextprotocol.io) server for the free [Open-Meteo](https://open-meteo.com) APIs. Plug it into Claude Desktop, Claude Code or any MCP client, then ask in plain language:

```
What were the temperatures in London during January 2023?
Compare the ICON and GFS ensemble forecasts for Berlin over the next 5 days.
Give me the current European AQI, UV index and pollen levels in Paris.
```

No API key is needed: Open-Meteo is free for non-commercial use.

## Features

- **17 tools** covering forecasts, ERA5 history, air quality, marine, flood, seasonal, ensemble and CMIP6 climate data, plus geocoding and elevation
- **Model-specific forecasts** from DWD ICON, NOAA GFS, Météo-France, ECMWF, JMA, MET Norway and Environment Canada GEM
- **Built for LLMs**: strict input schemas, server instructions that tell the model which tool answers which question, compact JSON responses capped at 25,000 characters
- **Two transports**: stdio for local clients, stateless Streamable HTTP for remote deployments, with API key auth, rate limiting and origin checks
- **In-memory response cache** with per-endpoint TTLs, so repeated questions don't hit Open-Meteo again
- **Self-hosting friendly**: every Open-Meteo endpoint can point at your own instance

## Getting started

You need [Node.js](https://nodejs.org) 22 or later. Nothing to install beforehand: `npx` fetches the server on first run.

### Claude Desktop

Add the server to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "open-meteo": {
      "command": "npx",
      "args": ["-y", "-p", "open-meteo-mcp-server", "open-meteo-mcp-server"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add open-meteo -- npx -y -p open-meteo-mcp-server open-meteo-mcp-server
```

### Other MCP clients

Any client that launches stdio servers works with the same command: `npx -y -p open-meteo-mcp-server open-meteo-mcp-server`. You can also install it globally with `npm install -g open-meteo-mcp-server` and run `open-meteo-mcp-server`.

> [!TIP]
> Every data tool takes coordinates. Ask with a place name and the model will call `geocoding` first to resolve it.

## Tools

| Category | Tool | What it answers |
|---|---|---|
| **Core** | `weather_forecast` | Forecast up to 16 days, picking the best model for the location. Recent past via `past_days` (up to 92) |
| | `weather_archive` | Historical weather from 1940 to yesterday (ERA5 reanalysis) |
| | `air_quality` | PM2.5, PM10, ozone, NO₂, pollen, European and US AQI, UV index |
| | `marine_weather` | Wave height, period and direction, swell, sea surface temperature |
| | `geocoding` | Place name or postal code to coordinates |
| | `elevation` | Terrain height for coordinates |
| **Models** | `dwd_icon_forecast` | DWD ICON (Germany, high resolution over Europe) |
| | `gfs_forecast` | NOAA GFS (global, high resolution over North America) |
| | `meteofrance_forecast` | Météo-France AROME and ARPEGE |
| | `ecmwf_forecast` | ECMWF IFS and AIFS |
| | `jma_forecast` | Japan Meteorological Agency |
| | `metno_forecast` | MET Norway (Nordic countries) |
| | `gem_forecast` | Environment Canada GEM |
| **Advanced** | `ensemble_forecast` | Forecast uncertainty across ensemble members. `models` is required |
| | `seasonal_forecast` | Outlook from a few weeks to about 7 months ahead |
| | `climate_projection` | CMIP6 climate projections, 1950 to 2050 |
| | `flood_forecast` | River discharge from GloFAS |

`weather_forecast` is the default choice. The model-specific tools are for when a particular model is asked for, or to compare models with one call each.

### Responses

- Times are GMT unless `timezone` is set. `timezone: "auto"` uses the location's local time.
- `null` in a series means the model has no value for that time, not zero.
- Responses over 25,000 characters have their `hourly` / `daily` / `minutely_15` arrays shortened by the same ratio, keeping series aligned, and gain `truncated: true` with a `truncation_message`. Narrow the date range or the variables to get everything.

The full list of variables and parameters is in each tool's input schema and in the [Open-Meteo documentation](https://open-meteo.com/en/docs).

## Remote deployment

Set `TRANSPORT=http` to serve MCP over Streamable HTTP at `/mcp` instead of stdio:

```bash
TRANSPORT=http HOST=0.0.0.0 PORT=3000 API_KEY=your-secret-key npx open-meteo-mcp-server
```

Clients then send the key with every request, as `Authorization: Bearer <key>` or `X-API-Key: <key>`. `GET /health` answers `{"status":"ok"}` without a key, for container probes.

The transport is stateless: each `POST /mcp` is handled on its own, no session ID is issued, and `GET` / `DELETE /mcp` answer `405`. No tool keeps state between calls, so clients lose nothing.

> [!IMPORTANT]
> The server binds to `127.0.0.1` by default, so it is reachable only from the local machine. Set `HOST=0.0.0.0` to accept remote connections, and set `API_KEY` whenever you do: without it, the server runs in open mode.

### Docker

A prebuilt image is published to the GitHub Container Registry. It already binds to `0.0.0.0`:

```bash
docker run -d --name open-meteo-mcp -p 3000:3000 \
  -e API_KEY=your-secret-key \
  ghcr.io/cmer81/open-meteo-mcp:latest
```

Tags follow the npm version without the `v` prefix: `latest`, `2.5.1`, `2.5`, `2`.

The repository also has `docker-compose.yml` (prebuilt image) and `docker-compose.dev.yml` (builds from source). Copy `.env.example` to `.env` to configure them.

### claude.ai traffic

Every claude.ai user reaches a remote server from Anthropic's outbound range `160.79.104.0/21`. That range gets its own rate-limit pool (`RATE_LIMIT_ANTHROPIC_RPM`) so they don't all share one per-IP budget. Behind a reverse proxy, list the proxy in `TRUSTED_PROXIES` so the real client IP is seen.

## Configuration

All variables are optional.

### Server

| Variable | Default | Description |
|---|---|---|
| `TRANSPORT` | stdio | `http` for Streamable HTTP |
| `PORT` | `3000` | HTTP port |
| `HOST` | `127.0.0.1` | Interface to bind. `0.0.0.0` accepts remote connections |
| `OPEN_METEO_CACHE_MAX_BYTES` | `20000000` | Response cache size, in bytes of serialized JSON. `0` disables it |

The cache keeps forecasts and ensembles for 15 minutes, air quality and marine for 30 minutes, flood for 1 hour, seasonal for 6 hours, archive and climate for 24 hours, geocoding for 7 days and elevation for 30 days. Archive ranges ending within the last 5 days are kept for 1 hour only, since Open-Meteo is still backfilling them. Failed requests are never cached.

> [!NOTE]
> The cache counts serialized JSON, but the parsed objects in memory take about 1.2 to 2.6 times as much. A full cache at the default size costs about 50 MB of heap.

### HTTP security

| Variable | Default | Description |
|---|---|---|
| `API_KEY` | unset (open) | Key required on every `/mcp` request |
| `RATE_LIMIT_RPM` | `60` | Requests per minute per client IP. IPv6 clients are grouped by /56 |
| `RATE_LIMIT_ANTHROPIC_RPM` | `600` | Requests per minute shared by all claude.ai traffic |
| `TRUSTED_PROXIES` | unset | Comma-separated IPs or CIDRs whose `X-Forwarded-For` is trusted |
| `ALLOWED_ORIGINS` | empty | Comma-separated browser origins allowed. Any request with an unlisted `Origin` header gets `403` (DNS rebinding protection). Requests without one are unaffected |

### Custom Open-Meteo instance

Each endpoint can be redirected, for example to a [self-hosted Open-Meteo](https://github.com/open-meteo/open-meteo):

| Variable | Default |
|---|---|
| `OPEN_METEO_API_URL` | `https://api.open-meteo.com` |
| `OPEN_METEO_ARCHIVE_API_URL` | `https://archive-api.open-meteo.com` |
| `OPEN_METEO_AIR_QUALITY_API_URL` | `https://air-quality-api.open-meteo.com` |
| `OPEN_METEO_MARINE_API_URL` | `https://marine-api.open-meteo.com` |
| `OPEN_METEO_SEASONAL_API_URL` | `https://seasonal-api.open-meteo.com` |
| `OPEN_METEO_ENSEMBLE_API_URL` | `https://ensemble-api.open-meteo.com` |
| `OPEN_METEO_GEOCODING_API_URL` | `https://geocoding-api.open-meteo.com` |
| `OPEN_METEO_FLOOD_API_URL` | `https://flood-api.open-meteo.com` |
| `OPEN_METEO_CLIMATE_API_URL` | `https://climate-api.open-meteo.com` |

In Claude Desktop, pass them through the `env` key of the server entry.

## Skills

The `skills/` directory holds two `SKILL.md` guides that help an assistant pick the right tool and parameters:

| Skill | Best for |
|---|---|
| [`open-meteo`](skills/open-meteo/SKILL.md) | Everyday weather: forecasts, history, air quality, marine, elevation |
| [`open-meteo-advanced`](skills/open-meteo-advanced/SKILL.md) | Specific models, ensemble uncertainty, seasonal outlooks, climate projections |

For Claude Code, copy them to `~/.claude/skills/`:

```bash
cp -r skills/open-meteo skills/open-meteo-advanced ~/.claude/skills/
```

For Claude Desktop, upload the relevant `SKILL.md` into the conversation.

## Development

```bash
git clone https://github.com/cmer81/open-meteo-mcp.git
cd open-meteo-mcp
npm install
npm run build
```

| Command | Description |
|---|---|
| `npm run dev` / `npm run dev:http` | Run from source with auto-reload (stdio / HTTP) |
| `npm test` | Unit tests (network mocked) |
| `npm run typecheck` / `npm run lint` | Type checking and Biome linting |
| `npm run smoke` | Calls all 17 tools against the live API through a real MCP client. Needs a prior build |
| `npm run eval` | LLM-usability benchmark, see below |

To point Claude Desktop at your local build, use `"command": "node"` with `"args": ["/path/to/open-meteo-mcp/dist/index.js"]`.

### Evaluations

`evals/evaluation.xml` checks whether an LLM given *only* this server's tools can answer realistic questions. Its 14 questions rely on stable data (ERA5 archive, CMIP6 projections, geocoding, elevation), so the expected answers don't drift.

```bash
pip install -r evals/scripts/requirements.txt
export ANTHROPIC_API_KEY=...        # or put it in .env

npm run build && npm run eval
npm run eval -- --no-server-instructions   # baseline without the server instructions
```

> [!WARNING]
> The evaluation calls the real Anthropic API for every question and consumes credits. It is a manual check, not part of CI.

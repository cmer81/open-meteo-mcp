# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Open-Meteo MCP (Model Context Protocol) server that provides comprehensive access to weather APIs for Large Language Models. It connects LLMs to Open-Meteo's weather forecasting, historical data, air quality, marine conditions, and climate projection services.

## Development Commands

```bash
# Build TypeScript to dist/
pnpm run build

# Development with auto-reload (stdio mode)
pnpm run dev

# Development with auto-reload (HTTP mode)
pnpm run dev:http

# Start production server (stdio mode - default)
pnpm start

# Start production server (HTTP mode)
pnpm run start:http

# Run tests
pnpm test

# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Docker (HTTP mode)
docker compose up -d
docker compose logs -f
docker compose down
```

## Architecture

### Transport Modes

The server supports two transport modes configured via `MCP_TRANSPORT` environment variable:

- **stdio** (default) - Standard input/output for MCP clients like Claude Desktop
- **http** - HTTP transport with SSE at `/mcp` endpoint for web integrations

HTTP mode configuration:
- `MCP_HOST` - Bind address (default: `127.0.0.1`)
- `MCP_PORT` - Port (default: `3000`)
- Endpoints: `POST/GET /mcp` (MCP JSON-RPC), `GET /health` (health check)

### Core Components

- **`src/index.ts`** - MCP server with dual transport support (stdio/HTTP). Creates `Server` instance, sets up request handlers, manages HTTP sessions via `StreamableHTTPServerTransport`
- **`src/client.ts`** - `OpenMeteoClient` class with separate Axios instances for each Open-Meteo service (forecast, archive, air quality, marine, seasonal, ensemble, geocoding)
- **`src/tools.ts`** - MCP tool definitions with JSON schemas. 17 tools covering weather forecasts, historical data, specialized models, and advanced forecasting
- **`src/types.ts`** - Zod validation schemas for all API parameters

### Tool Categories

- **Core**: `weather_forecast`, `weather_archive`, `air_quality`, `marine_weather`, `elevation`, `geocoding`
- **Regional models**: `dwd_icon_forecast`, `gfs_forecast`, `meteofrance_forecast`, `ecmwf_forecast`, `jma_forecast`, `metno_forecast`, `gem_forecast`
- **Advanced**: `flood_forecast`, `seasonal_forecast`, `climate_projection`, `ensemble_forecast`

## Key Implementation Patterns

### HTTP Session Management
In HTTP mode, each client session gets a dedicated `StreamableHTTPServerTransport` instance stored in a `Map<string, StreamableHTTPServerTransport>`. Session ID is returned in `mcp-session-id` header and must be included in subsequent requests.

### Parameter Building
`OpenMeteoClient.buildParams()` serializes parameters:
- Arrays → comma-joined strings
- Null/undefined → filtered out
- All values → strings for URL params

### Validation
Zod schemas enforce:
- Coordinate bounds (-90/90 lat, -180/180 lon)
- Weather variable enums per endpoint
- Date formats (YYYY-MM-DD)
- Forecast day limits (varies by service)

## Configuration Files

- `.env` / `.env.example` - Environment configuration for HTTP mode
- `mcp.json` - MCP client configuration for both stdio and HTTP modes
- `docker-compose.yml` - Container deployment for HTTP mode

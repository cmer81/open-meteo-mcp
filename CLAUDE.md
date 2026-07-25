# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Open-Meteo MCP (Model Context Protocol) server that provides comprehensive access to weather APIs for Large Language Models. It connects LLMs to Open-Meteo's weather forecasting, historical data, air quality, marine conditions, and climate projection services.

## Architecture

### Core Components

- **`src/index.ts`** - Main MCP server implementation using `@modelcontextprotocol/sdk`
- **`src/client.ts`** - HTTP client with multiple API endpoints (forecast, archive, air quality, marine, etc.)
- **`src/tools.ts`** - Tool metadata (name, title, description, annotations); input schemas come from `types.ts`
- **`src/types.ts`** - Zod validation schemas for all API parameters and responses
- **`src/truncation.ts`** - Caps oversized responses and serializes them for the client
- **`src/security.ts`** - Auth, origin validation, rate limiting, trusted-proxy IP extraction (HTTP transport only)

### API Client Architecture

The `OpenMeteoClient` class manages separate Axios instances for different Open-Meteo services:
- Main forecast API (`api.open-meteo.com`)
- Air quality API (`air-quality-api.open-meteo.com`)
- Marine weather API (`marine-api.open-meteo.com`)
- Archive/historical API (`archive-api.open-meteo.com`)
- Seasonal forecast API (`seasonal-api.open-meteo.com`)
- Ensemble forecast API (`ensemble-api.open-meteo.com`)
- Geocoding API (`geocoding-api.open-meteo.com`)
- Flood API (`flood-api.open-meteo.com`)

Each service can be configured via environment variables with sensible defaults.

### Transport Modes

The server supports two transport modes (configured via `TRANSPORT` env var):
- **stdio** (default) - Standard input/output for direct MCP client integration (Claude Desktop, etc.). Never write logs to stdout here — it would corrupt the protocol stream; `log()` writes to stderr.
- **Streamable HTTP** (`TRANSPORT=http`) - Express-based HTTP server with session management, listening on `PORT` (default: 3000) at `/mcp` endpoint, bound to `HOST` (default: `127.0.0.1`, loopback only)

### HTTP middleware ordering

Express runs middleware in declaration order, so every guard must be registered **before** the routes it protects. `createOriginValidator`, `createRateLimiter` and `createAuthMiddleware` are mounted ahead of the `/mcp` GET, POST and DELETE handlers; mounting them later silently leaves the earlier routes unauthenticated. `/health` is declared before the guards on purpose, so container probes work without a key.

### Tool System

Tools are organized by weather service type:
- **Core weather tools**: `weather_forecast`, `weather_archive`, `air_quality`, `marine_weather`, `elevation`, `geocoding`
- **Specialized model tools**: `dwd_icon_forecast`, `gfs_forecast`, `meteofrance_forecast`, `ecmwf_forecast`, `jma_forecast`, `metno_forecast`, `gem_forecast`
- **Advanced forecasting**: `flood_forecast`, `seasonal_forecast`, `climate_projection`, `ensemble_forecast`

Each tool has comprehensive JSON schema validation with proper enum constraints for weather variables and units.

## Development Commands

```bash
# Development with auto-reload
npm run dev

# Build TypeScript to dist/
npm run build

# Start production server 
npm start

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Evaluations

`evals/evaluation.xml` is an LLM-usability benchmark, not a unit test suite — it checks whether an LLM equipped with *only* this server's tools can answer real, complex questions using them. Run it with `npm run eval` (requires `ANTHROPIC_API_KEY` and `pip install -r evals/scripts/requirements.txt`; it calls the real Anthropic API, so it is a manual check, not part of CI).

Only `weather_archive`, `climate_projection`, `geocoding`, and `elevation` are exercised: the forecast/marine/flood/air-quality tools return live, "current" data with no historical equivalent, so their outputs would drift and can't produce a stable expected answer.

When adding, removing, or renaming a tool, or materially changing a tool's description or schema, add or update a `qa_pair` in `evals/evaluation.xml` that exercises it.

## Configuration

The server uses environment variables for API endpoints with fallback defaults:
- `OPEN_METEO_API_URL` - Main forecast API
- `OPEN_METEO_AIR_QUALITY_API_URL` - Air quality service
- `OPEN_METEO_MARINE_API_URL` - Marine weather service
- `OPEN_METEO_ARCHIVE_API_URL` - Historical data service
- `OPEN_METEO_SEASONAL_API_URL` - Seasonal forecasts
- `OPEN_METEO_ENSEMBLE_API_URL` - Ensemble forecasts
- `OPEN_METEO_GEOCODING_API_URL` - Geocoding service
- `OPEN_METEO_FLOOD_API_URL` - Flood forecast service
- `OPEN_METEO_CLIMATE_API_URL` - Climate projection service

Transport configuration:
- `TRANSPORT` - Set to `http` to enable Streamable HTTP mode (default: stdio)
- `PORT` - HTTP server port when using HTTP transport (default: 3000)
- `HOST` - Interface to bind (default: `127.0.0.1`). Set `0.0.0.0` to accept remote connections; the Docker image already does.

HTTP transport security (all optional, HTTP mode only):
- `API_KEY` - When set, every `/mcp` request needs `Authorization: Bearer <key>` or `X-API-Key`. Unset = open mode.
- `RATE_LIMIT_RPM` - Requests per minute per client IP (default: 60)
- `TRUSTED_PROXIES` - Comma-separated IPs/CIDRs whose `X-Forwarded-For` is trusted. Unset = header ignored.
- `ALLOWED_ORIGINS` - Comma-separated browser origins allowed (DNS rebinding protection). Empty by default: any request carrying an `Origin` header is rejected with 403. Requests without one are unaffected.

## Key Implementation Patterns

### Parameter Building
The `buildParams` method in `OpenMeteoClient` handles parameter serialization:
- Arrays are joined with commas (e.g., `['temperature_2m', 'humidity']` → `"temperature_2m,humidity"`)
- Null/undefined values are filtered out
- All values are converted to strings for URL parameters

### Error Handling
- Zod schema validation for all inputs with detailed error messages
- Axios timeout configuration (30 seconds)
- Comprehensive error catching in MCP tool handlers
- Proper User-Agent headers for API identification

### Response Formatting
All tool responses go through `serializeToolResponse()` (`src/truncation.ts`), which truncates if needed and JSON-stringifies with 2-space indentation. Always use it rather than calling `JSON.stringify` at the call site: truncation measures the text *as emitted*, and indentation roughly doubles the character count, so measuring one form while emitting another lets responses blow past the limit.

Responses over 25,000 characters have their `hourly`/`daily`/`minutely_15` arrays shrunk by an equal ratio (keeping parallel series aligned) or their `results` array trimmed, and gain `truncated: true` plus a `truncation_message`.

### Adding a tool with cross-field validation
`registerTool` publishes the JSON schema by introspecting the Zod object. A `.refine()`/`.superRefine()` returns a **ZodEffects**, which the SDK cannot introspect — it would publish an empty `{}` input schema while still validating strictly, leaving clients unable to know what to send. `registerReadOnlyTool` therefore unwraps via `.innerType()` for publication and re-applies the full schema (effects included) inside the handler. Keep both halves when adding a tool whose parameters have cross-field rules, such as `start_date <= end_date`.

## Schema Validation

All param schemas are `.strict()`, so unknown keys are rejected rather than silently forwarded to the upstream API.

Uses Zod for runtime validation of:
- Coordinate bounds (latitude: -90 to 90, longitude: -180 to 180)
- Weather variable enums (prevents invalid parameter combinations)
- Date format validation (YYYY-MM-DD pattern)
- Unit constraints (temperature, wind speed, precipitation units)
- Forecast day limits (varies by service: 7-16 days for most, up to 366 for flood forecasts)

## Weather Model Coverage

The server supports major global and regional weather models:
- **High-resolution regional**: DWD ICON (Europe), Météo-France AROME (France), JMA (Asia)
- **Global models**: NOAA GFS, ECMWF IFS
- **Regional specialists**: MET Norway (Nordics), Environment Canada GEM (North America)

Each model tool uses the same parameter schema but connects to different Open-Meteo endpoints optimized for that model's strengths.
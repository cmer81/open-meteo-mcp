# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an Open-Meteo MCP (Model Context Protocol) server that provides comprehensive access to weather APIs for Large Language Models. It connects LLMs to Open-Meteo's weather forecasting, historical data, air quality, marine conditions, and climate projection services.

## Architecture

### Core Components

- **`src/index.ts`** - Main MCP server implementation using `@modelcontextprotocol/sdk`
- **`src/client.ts`** - HTTP client with multiple API endpoints (forecast, archive, air quality, marine, etc.)
- **`src/tools.ts`** - MCP tool definitions with comprehensive JSON schemas
- **`src/types.ts`** - Zod validation schemas for all API parameters and responses

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
- **stdio** (default) - Standard input/output for direct MCP client integration (Claude Desktop, etc.)
- **Streamable HTTP** (`TRANSPORT=http`) - Express-based HTTP server with session management, listening on `PORT` (default: 3000) at `/mcp` endpoint

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
All tool responses return JSON-stringified weather data with 2-space indentation for readability in LLM contexts.

## Schema Validation

Uses Zod for runtime validation of:
- Coordinate bounds (latitude: -90 to 90, longitude: -180 to 180)
- Weather variable enums (prevents invalid parameter combinations)
- Date format validation (YYYY-MM-DD pattern)
- Unit constraints (temperature, wind speed, precipitation units)
- Forecast day limits (varies by service: 7-16 days for most, up to 210 for flood forecasts)

## Weather Model Coverage

The server supports major global and regional weather models:
- **High-resolution regional**: DWD ICON (Europe), Météo-France AROME (France), JMA (Asia)
- **Global models**: NOAA GFS, ECMWF IFS
- **Regional specialists**: MET Norway (Nordics), Environment Canada GEM (North America)

Each model tool uses the same parameter schema but connects to different Open-Meteo endpoints optimized for that model's strengths.
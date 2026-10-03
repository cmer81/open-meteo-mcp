# CLAUDE.md

Open-Meteo MCP (Model Context Protocol) server: gives LLMs access to Open-Meteo's forecast, historical, air quality, marine, flood, seasonal and climate projection APIs.

Detailed, area-specific guidance lives in `.claude/rules/` (loaded automatically when you touch the matching files) and the release procedure in the `/release` skill.

## Architecture

- **`src/index.ts`** - MCP server (`@modelcontextprotocol/sdk`), tool registration, both transports
- **`src/client.ts`** - `OpenMeteoClient`: one Axios instance per Open-Meteo service, LRU response cache
- **`src/tools.ts`** - Tool metadata (name, title, description, annotations); input schemas come from `types.ts`
- **`src/instructions.ts`** - Server `instructions` sent at initialize (lands in the client's system prompt): which tool answers which question. A test fails if a tool is not mentioned
- **`src/types.ts`** - Zod schemas for all API parameters and responses
- **`src/truncation.ts`** - Caps oversized responses and serializes them for the client
- **`src/security.ts`** - Auth, origin validation, rate limiting, trusted-proxy IP extraction (HTTP transport only)

### Transports

Selected by the `TRANSPORT` env var:
- **stdio** (default) - for local MCP clients. Never write logs to stdout here — it would corrupt the protocol stream; `log()` writes to stderr.
- **Streamable HTTP** (`TRANSPORT=http`) - stateless Express server on `/mcp`, bound to `127.0.0.1` by default.

### Tools (17)

- **Core**: `weather_forecast`, `weather_archive`, `air_quality`, `marine_weather`, `elevation`, `geocoding`
- **Model-specific** (same schema, different endpoint): `dwd_icon_forecast`, `gfs_forecast`, `meteofrance_forecast`, `ecmwf_forecast`, `jma_forecast`, `metno_forecast`, `gem_forecast`
- **Advanced**: `flood_forecast`, `seasonal_forecast`, `climate_projection`, `ensemble_forecast`

## Commands

```bash
npm run dev        # auto-reload
npm run build      # TypeScript -> dist/
npm start          # run the built server
npm test
npm run typecheck
npm run lint
npm run smoke      # every tool against the live API (needs a prior build)
```

`npm test` mocks the network. Run `npm run build && npm run smoke` after any `@modelcontextprotocol/sdk` or `zod` upgrade: it is the only check that catches a tool publishing an empty input schema.

## Hard rules

- **Never run `npm publish` locally.** Releases go through a `v*` tag and CI — use the `/release` skill.
- All tool responses go through `serializeToolResponse()`, never a bare `JSON.stringify`.
- Never mutate a response returned by the client: cached values are shared by reference.
- All param schemas stay `.strict()`.
- Evals (`npm run eval`) call the paid Anthropic API: manual only, never in CI.

## Configuration

All env vars (API URLs, cache size, transport, HTTP security) are documented with their defaults in the README's configuration section.

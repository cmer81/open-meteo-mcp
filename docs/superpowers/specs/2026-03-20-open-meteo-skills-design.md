# Design Spec: Open-Meteo User-Facing Skills

**Date:** 2026-03-20
**Status:** Approved

## Context

The repository currently contains a developer-oriented skill at `.agents/skills/open-meteo/` used during initial development. The goal is to replace it with user-facing skills that help AI assistants make the most of the Open-Meteo MCP server — both via AI CLIs (Claude Code, etc.) and Claude Desktop (uploaded as a document).

## Goals

- Help AI assistants discover and use the correct MCP tool for any weather-related request.
- Cover all 14 MCP tools.
- Target two user profiles: general users and power users / meteorology-aware users.
- Be distributable: installable as Claude Code skills, uploadable to Claude Desktop.

## Out of Scope

- Changes to MCP tools or server implementation.
- API reference documentation (already covered in `.agents/skills/open-meteo/references/`).

## File Structure

```
skills/
  open-meteo/
    SKILL.md                   ← General skill (7 tools)
  open-meteo-advanced/
    SKILL.md                   ← Advanced skill (7 specialized tools)

.agents/skills/open-meteo/     ← Deleted (was developer reference)
```

README gets a new `## Skills` section.

## Skill 1: `open-meteo`

### Frontmatter

```yaml
name: open-meteo
description: Use when the user asks about current weather, forecasts, historical weather, air quality, marine conditions, flooding, or elevation for any location worldwide.
```

### Tools Covered

| Tool | Purpose |
|------|---------|
| `geocoding` | Resolve a place name to coordinates + timezone |
| `weather_forecast` | Current conditions and forecasts up to 16 days |
| `weather_archive` | Historical weather data for a specific date range |
| `air_quality` | Air quality indices, pollutants, pollen |
| `marine_weather` | Wave height, swell, sea temperature, currents |
| `flood_forecast` | River discharge, flood risk up to 210 days |
| `elevation` | Altitude of one or more coordinates |

### Content Structure

1. **Overview** — The MCP provides real-time weather data via dedicated tools; no direct API calls needed.
2. **Decision tree** — Which tool to call based on the user's question:
   - City name without coordinates → call `geocoding` first
   - Current weather / next N days → `weather_forecast`
   - Past dates → `weather_archive`
   - Air pollution / pollen → `air_quality`
   - Waves / ocean conditions → `marine_weather`
   - River flood risk → `flood_forecast`
   - Altitude of a location → `elevation`
3. **Key parameters per tool** — Compact table: required params, common variables, available units.
4. **Examples** — 3–4 natural-language requests mapped to the correct tool + parameters.
5. **Best practices** — Always geocode if only a city name is provided; use `timezone=auto` for daily variables; request only needed variables.

## Skill 2: `open-meteo-advanced`

### Frontmatter

```yaml
name: open-meteo-advanced
description: Use when the user wants a specific weather model, needs ensemble uncertainty ranges, requests seasonal outlooks, or asks for long-term climate projections.
```

### Tools Covered

| Tool | Purpose |
|------|---------|
| `dwd_icon_forecast` | DWD ICON — Europe, high-resolution short range |
| `gfs_forecast` | NOAA GFS — global, good worldwide coverage |
| `meteofrance_forecast` | Météo-France AROME — France, DOM-TOM, Mediterranean |
| `ecmwf_forecast` | ECMWF IFS — global reference, highest quality |
| `jma_forecast` | JMA — Asia-Pacific |
| `metno_forecast` | MET Norway — Nordics, Arctic |
| `gem_forecast` | Environment Canada GEM — North America |
| `ensemble_forecast` | Uncertainty ranges over 35 days |
| `seasonal_forecast` | Temperature/precipitation anomalies over 6 months |
| `climate_projection` | CMIP6 climate scenarios 2015–2100 |

### Content Structure

1. **Overview** — When to use this skill vs `open-meteo`: user mentions a specific model, wants to compare models, or needs forecasts beyond 16 days.
2. **Model selection guide** — Table mapping region/use case to recommended tool.
3. **Long-range forecasting section**:
   - `ensemble_forecast` → uncertainty over 35 days, confidence intervals
   - `seasonal_forecast` → 6-month outlook, anomalies
   - `climate_projection` → multi-decade scenarios (CMIP6)
4. **Examples** — "Get ECMWF forecast for tomorrow in Bordeaux", "What will the climate be like in Lyon in 2080?", "Show me forecast uncertainty for next week."

## README Changes

New `## Skills` section covering:
- What skills are and their role
- How to install for Claude Code (`~/.claude/skills/`)
- How to use with Claude Desktop (upload SKILL.md as a document)
- Which skill to choose based on profile

## Deletions

- `.agents/skills/open-meteo/` — entire directory removed (replaced by `skills/`)

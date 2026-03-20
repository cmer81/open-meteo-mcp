# Design Spec: Open-Meteo User-Facing Skills

**Date:** 2026-03-20
**Status:** Approved

## Context

The repository currently contains a developer-oriented skill at `.agents/skills/open-meteo/` used during initial development. The goal is to replace it with user-facing skills that help AI assistants make the most of the Open-Meteo MCP server — both via AI CLIs (Claude Code, etc.) and Claude Desktop (uploaded as a document).

## Goals

- Help AI assistants discover and use the correct MCP tool for any weather-related request.
- Cover all 17 MCP tools across two skills (7 general + 10 advanced).
- Target two user profiles: general users and power users / meteorology-aware users.
- Be distributable: installable as Claude Code skills, uploadable to Claude Desktop.

## Out of Scope

- Changes to MCP tools or server implementation.
- The existing API reference documents at `.agents/skills/open-meteo/references/` are discarded along with the directory (they were developer-level content, not needed for user-facing skills).

## File Structure

All paths are relative to the repository root.

```
skills/
  open-meteo/
    SKILL.md                   ← General skill (7 tools)
  open-meteo-advanced/
    SKILL.md                   ← Advanced skill (10 tools)

.agents/skills/open-meteo/     ← Deleted (only this subdirectory; .agents/skills/ and .agents/ are removed if they become empty)
```

README gets a new `## Skills` section, placed after the `## Configuration` section.

## Skill 1: `open-meteo`

### Frontmatter

```yaml
name: open-meteo
description: Use when the user asks about current weather, forecasts, historical weather, air quality, marine conditions, flooding, or elevation for any location worldwide.
```

### Tools Covered (7)

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
   - Current weather / next N days (up to 16) → `weather_forecast`
   - Past dates → `weather_archive`
   - Air pollution / pollen → `air_quality`
   - Waves / ocean conditions → `marine_weather`
   - River flood risk → `flood_forecast`
   - Altitude of a location → `elevation`
   - Specific model, forecast > 16 days, seasonal outlook, or climate scenario → see `open-meteo-advanced`
3. **Key parameters per tool** — Compact table: required params, common variables, available units. For `weather_forecast`, note explicitly: only one model per request is supported — for multi-model comparison, use the model-specific tools in `open-meteo-advanced` with parallel calls.
4. **Examples** — 3–4 natural-language requests mapped to the correct tool + parameters.
5. **Best practices** — Always geocode if only a city name is provided; use `timezone=auto` for daily variables; request only needed variables.

## Skill 2: `open-meteo-advanced`

### Frontmatter

```yaml
name: open-meteo-advanced
description: Use when the user wants a specific weather model, needs ensemble uncertainty ranges, requests seasonal outlooks, or asks for long-term climate projections.
```

### Tools Covered (10)

| Tool | Coverage / Notes |
|------|-----------------|
| `dwd_icon_forecast` | DWD ICON — Europe only |
| `gfs_forecast` | NOAA GFS — global |
| `meteofrance_forecast` | Météo-France AROME/ARPEGE — France, DOM-TOM, Mediterranean/Europe |
| `ecmwf_forecast` | ECMWF IFS — global reference, highest quality |
| `jma_forecast` | JMA — Asia-Pacific |
| `metno_forecast` | MET Norway — `metno_nordic` (Nordic region, 1 km, 2.5-day horizon), `metno_seamless` (Nordic-primary with global extension via blending — not a general-purpose global model) |
| `gem_forecast` | Environment Canada GEM — North America |
| `ensemble_forecast` | Uncertainty ranges over 35 days; returns member arrays |
| `seasonal_forecast` | Temperature/precipitation anomalies over 6 months |
| `climate_projection` | CMIP6 daily data from 1950 to 2050 |

### Content Structure

1. **Overview** — When to use this skill vs `open-meteo`: user mentions a specific model, wants to compare models, or needs forecasts beyond 16 days.
2. **Model selection guide** — Table mapping region/use case to recommended tool. Note geographic constraints explicitly (e.g., `dwd_icon_forecast` is Europe-only; `metno_nordic` covers Nordic region only; `metno_seamless` is Nordic-primary with global extension via blending, not a general-purpose global model; `meteofrance_forecast` covers France + DOM-TOM + Mediterranean/Europe).
3. **Key parameters per tool** — Same compact table format as Skill 1: required params, notable constraints, available variables. Highlight: all model-specific tools support only one model per request — for multi-model comparison, make parallel calls.
4. **Long-range forecasting section**:
   - `ensemble_forecast` → uncertainty over 35 days; response contains member arrays, not scalar point values — each variable is returned as suffixed keys per member (e.g., `temperature_2m_member01`, `temperature_2m_member02`, …); include a note or short example showing this naming pattern
   - `seasonal_forecast` → 6-month outlook, anomalies vs climatology
   - `climate_projection` → daily data from 1950 to 2050 (CMIP6); data before the current date represents model simulation output for validation purposes, not observed historical data
5. **Examples** — "Get ECMWF forecast for tomorrow in Bordeaux", "What will the climate be like in Lyon in 2040?", "Show me forecast uncertainty with confidence intervals for next week."
6. **Best practices** — Don't use regional model tools outside their geographic coverage; ensemble forecasts return member arrays not scalar values; geocode first if only a city name is provided.

## README Changes

New `## Skills` section covering:
- What skills are and their role (help AI use the MCP tools effectively)
- How to install both skills for Claude Code, with copy commands:
  ```bash
  cp -r skills/open-meteo ~/.claude/skills/
  cp -r skills/open-meteo-advanced ~/.claude/skills/
  ```
  Result: `~/.claude/skills/open-meteo/SKILL.md` and `~/.claude/skills/open-meteo-advanced/SKILL.md`
- How to use with Claude Desktop: upload one skill file per conversation as a document (`skills/open-meteo/SKILL.md` for everyday weather, or `skills/open-meteo-advanced/SKILL.md` for model/climate queries)
- Which skill to choose: `open-meteo` for everyday weather questions; `open-meteo-advanced` for specific models, ensemble uncertainty, seasonal outlooks, or climate projections

## Deletions

- `.agents/skills/open-meteo/` — the entire subdirectory is removed, including `references/` (13 reference files). Before removing parent directories, verify their contents: if `.agents/skills/` contains only `open-meteo/`, remove it too; if `.agents/` then contains only `skills/`, remove it too. Do not remove parent directories blindly.

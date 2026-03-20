---
name: open-meteo
description: Use when the user asks about current weather, forecasts, historical weather, air quality, marine conditions, flooding, or elevation for any location worldwide.
---

# Open-Meteo MCP

## Overview

This MCP server provides direct access to Open-Meteo weather APIs via dedicated tools. No direct API calls needed — call the appropriate tool with coordinates and the variables you want.

If you only have a city name, call `geocoding` first to obtain coordinates and timezone.

## Which Tool to Use

| Scenario | Tool |
|----------|------|
| City name → coordinates + timezone | `geocoding` |
| Current weather or forecast (up to 16 days) | `weather_forecast` |
| Historical weather (past dates) | `weather_archive` |
| Air quality, pollutants, pollen | `air_quality` |
| Wave height, swell, sea temperature, currents | `marine_weather` |
| River discharge, flood risk (up to 210 days) | `flood_forecast` |
| Elevation / altitude of a location | `elevation` |
| Specific model, forecast > 16 days, seasonal, or climate projection | → use `open-meteo-advanced` |

## Key Parameters

### `geocoding`
| Parameter | Required | Notes |
|-----------|----------|-------|
| `name` | Yes | City or place name |
| `count` | No | Max results (default 1) |
| `language` | No | Response language (e.g., `fr`, `en`) |

Returns: `latitude`, `longitude`, `timezone`, `country`.
Attribution: geocoding data from GeoNames.

### `weather_forecast`
| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | WGS84 coordinates |
| `hourly` | No* | Hourly time series |
| `daily` | No* | Day-level aggregates |
| `current` | No* | Current conditions (any hourly variable) |
| `forecast_days` | No | 0–16, default 7 |
| `past_days` | No | 0–92 (recent history without archive) |
| `timezone` | No** | Required for `daily`; use `auto` for local time |
| `temperature_unit` | No | `celsius` (default) or `fahrenheit` |
| `wind_speed_unit` | No | `kmh` (default), `ms`, `mph`, `kn` |
| `precipitation_unit` | No | `mm` (default) or `inch` |
| `start_date` / `end_date` | No | `YYYY-MM-DD` alternative to forecast_days |

\*At least one of `hourly`, `daily`, or `current` is required.
\*\*Always set `timezone=auto` when requesting `daily` variables.

**One model per request.** For multi-model comparison, use `open-meteo-advanced` model tools in parallel.

**Common hourly variables:** `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `precipitation`, `precipitation_probability`, `wind_speed_10m`, `wind_direction_10m`, `weather_code`, `cloud_cover`, `uv_index`, `visibility`, `is_day`

**Common daily variables:** `temperature_2m_max`, `temperature_2m_min`, `apparent_temperature_max`, `precipitation_sum`, `precipitation_probability_max`, `wind_speed_10m_max`, `wind_gusts_10m_max`, `weather_code`, `sunrise`, `sunset`, `uv_index_max`, `shortwave_radiation_sum`

### `weather_archive`
Same parameters as `weather_forecast`, with these differences:
| Parameter | Required | Notes |
|-----------|----------|-------|
| `start_date` | Yes | `YYYY-MM-DD` |
| `end_date` | Yes | `YYYY-MM-DD` |

Use `past_days` on `weather_forecast` for recent history (up to 92 days back). Use `weather_archive` for older dates.

### `air_quality`
| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | |
| `hourly` | No* | Hourly air quality variables |
| `current` | No* | Current conditions |
| `forecast_days` | No | 0–7, default 5 |
| `domains` | No | `auto` (default), `cams_europe`, `cams_global` |

**Common variables:** `pm2_5`, `pm10`, `european_aqi`, `us_aqi`, `carbon_monoxide`, `nitrogen_dioxide`, `ozone`, `sulphur_dioxide`, `dust`, `uv_index`, `alder_pollen`, `birch_pollen`, `grass_pollen`, `mugwort_pollen`, `olive_pollen`, `ragweed_pollen`

\*At least one of `hourly` or `current` is required.

Attribution: air quality data from CAMS (Copernicus Atmosphere Monitoring Service).

### `marine_weather`
| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | Use sea/ocean coordinates |
| `hourly` | No* | Hourly ocean/wave variables |
| `daily` | No* | Daily aggregates |
| `forecast_days` | No | 0–7 |
| `timezone` | No | Use `auto` for daily variables |

**Common hourly variables:** `wave_height`, `wave_direction`, `wave_period`, `wind_wave_height`, `wind_wave_direction`, `wind_wave_period`, `swell_wave_height`, `swell_wave_direction`, `swell_wave_period`, `sea_surface_temperature`, `ocean_current_velocity`, `ocean_current_direction`

**Common daily variables:** `wave_height_max`, `wave_direction_dominant`, `wave_period_max`, `swell_wave_height_max`

### `flood_forecast`
| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | |
| `daily` | No* | River discharge variables |
| `forecast_days` | No | 1–210, default 92 |
| `ensemble` | No | Set `true` to return all ensemble members |

**Variables:** `river_discharge` (deterministic), `river_discharge_mean`, `river_discharge_median`, `river_discharge_max`, `river_discharge_min`, `river_discharge_p25`, `river_discharge_p75`

Data source: GloFAS (Global Flood Awareness System).

### `elevation`
| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | Single WGS84 coordinate pair |

Returns altitude in metres.

## Examples

**"What is the weather like in Lyon tomorrow?"**
1. `geocoding` with `name: "Lyon"` → `latitude`, `longitude`, `timezone`
2. `weather_forecast` with those coordinates + `daily: ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "weather_code"]`, `forecast_days: 2`, `timezone: "auto"`

**"Is the air quality good in Paris right now?"**
1. `geocoding` with `name: "Paris"` → coordinates
2. `air_quality` with coordinates + `current: ["european_aqi", "pm2_5", "pm10"]`

**"What was the average temperature in Berlin in July 2024?"**
1. `geocoding` with `name: "Berlin"` → coordinates, timezone
2. `weather_archive` with coordinates + `daily: ["temperature_2m_max", "temperature_2m_min"]`, `start_date: "2024-07-01"`, `end_date: "2024-07-31"`, `timezone: "auto"`

**"What are the wave conditions near Biarritz this weekend?"**
1. `geocoding` with `name: "Biarritz"` → coordinates
2. `marine_weather` with coordinates + `hourly: ["wave_height", "wave_direction", "wave_period", "swell_wave_height"]`, `forecast_days: 3`

## Best Practices

- **Always geocode first** if you only have a city or place name.
- **Always set `timezone=auto`** when requesting `daily` variables — otherwise results are in UTC and day boundaries will be wrong for non-UTC locations.
- **Request only the variables you need** — smaller payloads are faster and easier to parse.
- **Use `current`** for instant conditions, `hourly` for time series, `daily` for day-level summaries.
- **`forecast_days: 1`** returns today only; `forecast_days: 2` returns today + tomorrow.
- For multi-model comparison or forecasts beyond 16 days, use `open-meteo-advanced`.

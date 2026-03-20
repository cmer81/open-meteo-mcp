---
name: open-meteo-advanced
description: Use when the user wants a specific weather model, needs ensemble uncertainty ranges, requests seasonal outlooks, or asks for long-term climate projections.
---

# Open-Meteo MCP — Advanced

## Overview

Use this skill when:
- The user asks for a **specific weather model** (ECMWF, GFS, DWD ICON, Météo-France, JMA, MET Norway, GEM)
- The user wants to **compare models** (make parallel calls, one per model tool)
- Forecasts **beyond 16 days** are needed
- **Ensemble uncertainty** / confidence intervals are requested
- A **seasonal outlook** (1–9 months) or **climate projection** (to 2050) is needed

For everyday weather questions, use `open-meteo` instead.

## Model Selection Guide

| Tool | Provider | Geographic Focus | Horizon | Best For |
|------|----------|-----------------|---------|----------|
| `ecmwf_forecast` | ECMWF IFS | Global | 15 days | Highest global accuracy |
| `gfs_forecast` | NOAA GFS | Global | 16 days | Global, especially Americas |
| `dwd_icon_forecast` | DWD ICON | **Europe only** | 2–7.5 days | High-res Europe |
| `meteofrance_forecast` | Météo-France AROME/ARPEGE | France, DOM-TOM, Mediterranean/Europe | 2–4 days | France + nearby regions |
| `jma_forecast` | JMA | Asia-Pacific | 4–11 days | Japan and Asia-Pacific |
| `metno_forecast` | MET Norway | Nordic-primary (global extension via blending) | 2.5 days | Nordic region precision |
| `gem_forecast` | Environment Canada GEM | North America | 2–10 days | Canada |
| `ensemble_forecast` | Multi-model | Global | 35 days | Forecast uncertainty ranges |
| `seasonal_forecast` | ECMWF SEAS5 | Global | 45–274 days | 1–9 month outlook |
| `climate_projection` | CMIP6 | Global | 1950–2050 | Multi-decade scenarios |

**Geographic constraints:**
- `dwd_icon_forecast`: Europe only — do not use for other regions.
- `metno_forecast` with `metno_nordic`: Nordic region only. `metno_seamless` is Nordic-primary with global extension via blending, not a general-purpose global model.
- `meteofrance_forecast`: France + DOM-TOM + Mediterranean/Europe coverage.

## Key Parameters

### Model-specific forecast tools

Applies to: `dwd_icon_forecast`, `gfs_forecast`, `meteofrance_forecast`, `ecmwf_forecast`, `jma_forecast`, `metno_forecast`, `gem_forecast`

All share the same parameters as `weather_forecast` (see `open-meteo` skill), plus:

| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | |
| `models` | Yes* | **Exactly one model per request** |
| `hourly` / `daily` / `current` | No** | Same variables as `weather_forecast` |

\*`metno_forecast` can omit `models` to use the default Met.no model.
\*\*At least one variable group required.

**Multi-model comparison:** Make parallel tool calls, one per model.

**Model key examples:**

| Tool | Example model keys |
|------|--------------------|
| `ecmwf_forecast` | `ecmwf_ifs`, `ecmwf_ifs025`, `best_match` (only these 3 are valid) |
| `dwd_icon_forecast` | `dwd_icon_seamless`, `dwd_icon_global`, `dwd_icon_eu`, `dwd_icon_d2` |
| `gfs_forecast` | `ncep_gfs_global`, `ncep_gfs_seamless`, `ncep_hrrr_us_conus` |
| `meteofrance_forecast` | `meteofrance_seamless`, `meteofrance_arome_france`, `meteofrance_arpege_europe` |
| `jma_forecast` | `jma_seamless`, `jma_msm`, `jma_gsm` |
| `metno_forecast` | `metno_nordic`, `metno_seamless` |
| `gem_forecast` | `gem_global`, `gem_regional`, `gem_seamless` |

**ECMWF warning:** `ecmwf_ifs_025`, `ecmwf_ifs_hres_9km`, and `ecmwf_aifs_025_single` are NOT valid on `ecmwf_forecast` and will return HTTP 400.

### `ensemble_forecast`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | |
| `models` | Yes | One ensemble model per request (required) |
| `hourly` | No* | Same variables as `weather_forecast` |
| `forecast_days` | No | 1–35, default 7 |

**Response format:** Each variable is returned as one array per ensemble member:

```json
{
  "hourly": {
    "time": ["2024-01-01T00:00", "2024-01-01T01:00", "..."],
    "temperature_2m_member01": [2.1, 2.3, "..."],
    "temperature_2m_member02": [1.8, 2.0, "..."],
    "temperature_2m_member03": [2.4, 2.6, "..."]
  }
}
```

To derive uncertainty ranges, calculate min/max/percentiles across all `_memberNN` arrays for each timestep.

### `seasonal_forecast`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | |
| `hourly` | No* | 6-hourly variables: `temperature_2m`, `precipitation`, `wind_speed_10m`, `relative_humidity_2m`, `cloud_cover`, `pressure_msl`, `soil_moisture_0_to_10cm` |
| `daily` | No* | `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `wind_speed_10m_max` |
| `forecast_days` | No | `45`, `92` (default), `183`, or `274` |

Output represents **ensemble anomalies relative to climatology**, not absolute forecasts.

### `climate_projection`

| Parameter | Required | Notes |
|-----------|----------|-------|
| `latitude`, `longitude` | Yes | |
| `start_date` | Yes | `YYYY-MM-DD` (supported range: 1950-01-01 to 2050-12-31) |
| `end_date` | Yes | `YYYY-MM-DD` |
| `daily` | Yes | One or more of: `temperature_2m_max`, `temperature_2m_min`, `temperature_2m_mean`, `precipitation_sum`, `wind_speed_10m_mean`, `wind_speed_10m_max`, `cloud_cover_mean`, `relative_humidity_2m_mean`, `shortwave_radiation_sum`, `soil_moisture_0_to_10cm_mean`, `pressure_msl_mean` |
| `models` | Yes | CMIP6 models (array, at least one): `CMCC_CM2_VHR4`, `MRI_AGCM3_2_S`, `EC_Earth3P_HR`, `MPI_ESM1_2_XR`, `NICAM16_8S`, `FGOALS_f3_H`, `HiRAM_SIT_HR` |

**Data note:** Dates before the current year represent CMIP6 model simulation output for validation purposes, not observed historical measurements. For real historical weather data, use `weather_archive`.

## Examples

**"Get the ECMWF forecast for Bordeaux tomorrow"**
1. `geocoding` with `name: "Bordeaux"` → coordinates
2. `ecmwf_forecast` with coordinates + `models: "ecmwf_ifs"`, `daily: ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "weather_code"]`, `forecast_days: 2`, `timezone: "auto"`

**"Compare DWD ICON and GFS forecasts for Berlin this week"**
1. `geocoding` with `name: "Berlin"` → coordinates
2. Two parallel calls:
   - `dwd_icon_forecast` with `models: "dwd_icon_seamless"`, `daily: ["temperature_2m_max", "precipitation_sum"]`, `forecast_days: 7`, `timezone: "auto"`
   - `gfs_forecast` with `models: "ncep_gfs_global"`, `daily: ["temperature_2m_max", "precipitation_sum"]`, `forecast_days: 7`, `timezone: "auto"`

**"Show me forecast uncertainty for Paris next week"**
1. `geocoding` with `name: "Paris"` → coordinates
2. `ensemble_forecast` with coordinates + `hourly: ["temperature_2m"]`, `forecast_days: 10`
   The response will contain `temperature_2m_member01`, `temperature_2m_member02`, etc. — calculate spread across members for uncertainty.

**"What will the climate be like in Lyon in 2040?"**
1. `geocoding` with `name: "Lyon"` → coordinates
2. `climate_projection` with coordinates + `start_date: "2040-01-01"`, `end_date: "2040-12-31"`, `models: ["MRI_AGCM3_2_S"]`, `daily: ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"]`

## Best Practices

- **Don't use regional model tools outside their geographic coverage** — `dwd_icon_forecast` for Asia will return empty or incorrect data.
- **`ecmwf_forecast` accepts only 3 model IDs** — `ecmwf_ifs`, `ecmwf_ifs025`, or `best_match`. Any other ECMWF key causes HTTP 400.
- **Ensemble output is member arrays, not scalar values** — process all `_memberNN` keys to derive uncertainty ranges.
- **Climate data before the current year is CMIP6 simulation**, not observed data — use `weather_archive` for real historical measurements.
- **`seasonal_forecast` outputs anomalies**, not absolute values — it answers "warmer than usual?" not "what temperature exactly?".
- **Geocode first** if you only have a city name.

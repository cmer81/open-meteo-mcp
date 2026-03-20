# Open-Meteo User-Facing Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create two user-facing SKILL.md files covering all 17 MCP tools, add README installation instructions, and remove the old developer skill directory.

**Architecture:** Two standalone Markdown skill files — `skills/open-meteo/SKILL.md` (7 general tools) and `skills/open-meteo-advanced/SKILL.md` (10 specialized tools) — plus a README section. No code changes.

**Tech Stack:** Markdown, Git. No build tools required.

---

## File Map

| Action | Path |
|--------|------|
| Create | `skills/open-meteo/SKILL.md` |
| Create | `skills/open-meteo-advanced/SKILL.md` |
| Modify | `README.md` (add `## Skills` section after `## Configuration`) |
| Delete | `.agents/skills/open-meteo/` (entire subdirectory + parent dirs if empty) |

**Source of truth for tool names and parameters:** `src/tools.ts`

---

## Task 1: Create `skills/open-meteo/SKILL.md`

**Files:**
- Create: `skills/open-meteo/SKILL.md`

- [ ] **Step 1: Verify tool names from source**

  Run the following to confirm all 7 tool names exist in `src/tools.ts`:
  ```bash
  grep -E "name: '(geocoding|weather_forecast|weather_archive|air_quality|marine_weather|flood_forecast|elevation)'" src/tools.ts
  ```
  Expected: 7 matches. If any name is missing, check `src/tools.ts` and correct the name before writing.

- [ ] **Step 2: Create the skills directory and write the file**

  Create `skills/open-meteo/SKILL.md` with this exact content:

  ````markdown
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
  | `latitude`, `longitude` | Yes | Single or comma-separated multiple coordinates |

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
  ````

- [ ] **Step 3: Verify the file was created correctly**

  ```bash
  grep -c "geocoding\|weather_forecast\|weather_archive\|air_quality\|marine_weather\|flood_forecast\|elevation" skills/open-meteo/SKILL.md
  ```
  Expected: at least 7 (each tool name appears at least once).

- [ ] **Step 4: Commit**

  ```bash
  git add skills/open-meteo/SKILL.md
  git commit -m "feat: add open-meteo general skill (7 tools)"
  ```

---

## Task 2: Create `skills/open-meteo-advanced/SKILL.md`

**Files:**
- Create: `skills/open-meteo-advanced/SKILL.md`

- [ ] **Step 1: Verify advanced tool names from source**

  ```bash
  grep -E "name: '(dwd_icon_forecast|gfs_forecast|meteofrance_forecast|ecmwf_forecast|jma_forecast|metno_forecast|gem_forecast|ensemble_forecast|seasonal_forecast|climate_projection)'" src/tools.ts
  ```
  Expected: 10 matches. Correct any name discrepancy before writing.

- [ ] **Step 2: Verify ECMWF valid model IDs**

  ```bash
  grep -A5 "ecmwf_forecast" src/tools.ts | grep "ecmwf_ifs"
  ```
  Expected output contains `ecmwf_ifs`, `ecmwf_ifs025`, `best_match`.

- [ ] **Step 3: Verify climate date range**

  ```bash
  grep "start_date\|end_date\|1950\|2050" .agents/skills/open-meteo/references/climate-projection-api.md | head -5
  ```
  Expected: confirms 1950-01-01 to 2050-12-31.

- [ ] **Step 4: Write the file**

  Create `skills/open-meteo-advanced/SKILL.md` with this exact content:

  ````markdown
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
  | `hourly` | No* | Same variables as `weather_forecast` |
  | `models` | No | One ensemble model per request |
  | `forecast_days` | No | Up to 35 days |

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
  | `daily` | No* | `temperature_2m_max`, `temperature_2m_min`, `temperature_2m_mean`, `precipitation_sum`, `wind_speed_10m_mean`, `wind_speed_10m_max`, `cloud_cover_mean`, `relative_humidity_2m_mean`, `shortwave_radiation_sum`, `soil_moisture_0_to_10cm_mean`, `pressure_msl_mean` |
  | `models` | No | CMIP6 models (array): `CMCC_CM2_VHR4`, `MRI_AGCM3_2_S`, `EC_Earth3P_HR`, `MPI_ESM1_2_XR`, `NICAM16_8S`, `FGOALS_f3_H`, `HiRAM_SIT_HR` |

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
  ````

- [ ] **Step 5: Verify the file was created correctly**

  ```bash
  grep -c "dwd_icon_forecast\|gfs_forecast\|meteofrance_forecast\|ecmwf_forecast\|jma_forecast\|metno_forecast\|gem_forecast\|ensemble_forecast\|seasonal_forecast\|climate_projection" skills/open-meteo-advanced/SKILL.md
  ```
  Expected: at least 10 (each tool name appears at least once).

- [ ] **Step 6: Commit**

  ```bash
  git add skills/open-meteo-advanced/SKILL.md
  git commit -m "feat: add open-meteo-advanced skill (10 tools)"
  ```

---

## Task 3: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Locate the end of the `## Configuration` section**

  ```bash
  grep -n "^## " README.md
  ```
  Identify the line numbers for `## Configuration` and the next section after it.

- [ ] **Step 2: Insert the `## Skills` section**

  Insert the following block between `## Configuration` and the next section (currently `## Usage Examples`):

  ````markdown
  ## Skills

  The `skills/` directory contains SKILL.md files that help AI assistants use this MCP server effectively. They act as contextual guides — the AI reads the relevant skill to know which tool to call and how to use its parameters.

  ### Available skills

  | Skill | File | Best for |
  |-------|------|----------|
  | `open-meteo` | `skills/open-meteo/SKILL.md` | Everyday weather: forecasts, historical data, air quality, marine conditions, elevation |
  | `open-meteo-advanced` | `skills/open-meteo-advanced/SKILL.md` | Specific models (ECMWF, GFS, DWD ICON…), ensemble uncertainty, seasonal outlooks, climate projections |

  ### Using with Claude Code (CLI)

  Copy the skill(s) to your Claude skills directory:

  ```bash
  cp -r skills/open-meteo ~/.claude/skills/
  cp -r skills/open-meteo-advanced ~/.claude/skills/
  ```

  This installs them at `~/.claude/skills/open-meteo/SKILL.md` and `~/.claude/skills/open-meteo-advanced/SKILL.md`. Claude Code will load the relevant skill automatically when you ask weather-related questions.

  ### Using with Claude Desktop

  Upload the SKILL.md file directly as a document in your Claude Desktop conversation:
  - For everyday weather questions: upload `skills/open-meteo/SKILL.md`
  - For model selection, ensemble, or climate projections: upload `skills/open-meteo-advanced/SKILL.md`

  Upload one skill per conversation. The AI will use it as a reference guide throughout the session.
  ````

- [ ] **Step 3: Verify the section was inserted correctly**

  ```bash
  grep -n "^## Skills\|cp -r skills/open-meteo" README.md
  ```
  Expected: both lines found at the correct position (between Configuration and Usage Examples).

- [ ] **Step 4: Commit**

  ```bash
  git add README.md
  git commit -m "docs: add Skills section to README with install instructions"
  ```

---

## Task 4: Remove old developer skill

**Files:**
- Delete: `.agents/skills/open-meteo/` (and parent dirs if empty)

- [ ] **Step 1: Confirm what's in `.agents/`**

  ```bash
  find .agents -type f | sort
  ```
  Expected: only files under `.agents/skills/open-meteo/` (the old dev skill). If other files exist under `.agents/`, do NOT remove parent directories.

- [ ] **Step 2: Remove the old skill subdirectory**

  ```bash
  rm -rf .agents/skills/open-meteo
  ```

- [ ] **Step 3: Remove parent dirs if empty**

  ```bash
  # Remove .agents/skills/ if now empty
  if [ -z "$(ls -A .agents/skills 2>/dev/null)" ]; then rmdir .agents/skills; fi
  # Remove .agents/ if now empty
  if [ -z "$(ls -A .agents 2>/dev/null)" ]; then rmdir .agents; fi
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add -A
  git commit -m "chore: remove old developer skill (.agents/skills/open-meteo)"
  ```

---

## Task 5: Final verification

- [ ] **Step 1: Verify skills directory structure**

  ```bash
  find skills -type f
  ```
  Expected output:
  ```
  skills/open-meteo/SKILL.md
  skills/open-meteo-advanced/SKILL.md
  ```

- [ ] **Step 2: Verify .agents is gone**

  ```bash
  ls .agents 2>&1
  ```
  Expected: `ls: cannot access '.agents': No such file or directory`

- [ ] **Step 3: Verify README has the Skills section**

  ```bash
  grep -A3 "^## Skills" README.md
  ```
  Expected: shows the Skills section header and first few lines.

- [ ] **Step 4: Verify all 17 tool names appear across both skills**

  ```bash
  grep -h "geocoding\|weather_forecast\|weather_archive\|air_quality\|marine_weather\|flood_forecast\|elevation\|dwd_icon_forecast\|gfs_forecast\|meteofrance_forecast\|ecmwf_forecast\|jma_forecast\|metno_forecast\|gem_forecast\|ensemble_forecast\|seasonal_forecast\|climate_projection" skills/open-meteo/SKILL.md skills/open-meteo-advanced/SKILL.md | grep -oE "(geocoding|weather_forecast|weather_archive|air_quality|marine_weather|flood_forecast|elevation|dwd_icon_forecast|gfs_forecast|meteofrance_forecast|ecmwf_forecast|jma_forecast|metno_forecast|gem_forecast|ensemble_forecast|seasonal_forecast|climate_projection)" | sort -u
  ```
  Expected: 17 unique tool names.

- [ ] **Step 5: Verify git history is clean**

  ```bash
  git log --oneline -5
  ```
  Expected: 4 commits visible — general skill, advanced skill, README, chore deletion.

# Open-Meteo Weather Forecast API (in-scope)

Source of truth: https://open-meteo.com/en/docs

## Base URL

- `https://api.open-meteo.com/v1/forecast`

## Request shape

- HTTP method: `GET`
- Query parameters are URL-encoded.

### Multi-location batching

- `latitude` and `longitude` accept **comma-separated lists**.
- When multiple locations are requested, the **JSON output shape changes** (docs note this explicitly).
- CSV/XLSX export adds a `location_id` column.

## Core query parameters

### Required

- `latitude` (float)
- `longitude` (float)

### Variable selection

- `hourly` (string array): comma-separated or repeated `&hourly=` parameters.
- `daily` (string array): comma-separated or repeated `&daily=` parameters.
  - **Important:** If `daily` variables are specified, `timezone` is required.
- `current` (string array): current-condition variables.

### Time controls

- `timezone` (string, default `GMT`)
  - Use a TZ database name (e.g., `Europe/Berlin`).
  - `timezone=auto` resolves coordinates to the local timezone.
  - If timezone is set, timestamps are returned in local time and data starts at 00:00 local-time.

- `timeformat` (string, default `iso8601`)
  - `iso8601` or `unixtime`.
  - **If `unixtime`:** timestamps are returned in GMT+0; apply `utc_offset_seconds` to get correct local dates.

- `forecast_days` (int 0–16, default 7)
- `past_days` (int 0–92, default 0)

- Fine-grained timestep control:
  - `forecast_hours`, `past_hours`
  - For 15-minutely data: `forecast_minutely_15`, `past_minutely_15`

- Explicit time interval:
  - `start_date`, `end_date` (YYYY-MM-DD)
  - For hourly/15-minutely: `start_hour`, `end_hour`, `start_minutely_15`, `end_minutely_15` (YYYY-MM-DDThh:mm)

### Units

- `temperature_unit` (default `celsius`): set to `fahrenheit` to convert.
- `wind_speed_unit` (default `kmh`): alternatives `ms`, `mph`, `kn`.
- `precipitation_unit` (default `mm`): alternative `inch`.

### Models

- `models` (string array, default `auto`)
  - Docs note: “Best match” provides the best forecast worldwide.
  - “Seamless” combines models from a provider into a seamless prediction.

### Elevation and grid-cell selection

- `elevation` (float)
  - Default: uses a 90m digital elevation model.
  - `elevation=nan` disables downscaling.
- `cell_selection` (string, default `land`)
  - `land`: prefers a land grid-cell with similar elevation.
  - `sea`: prefers sea grid-cells.
  - `nearest`: nearest possible grid-cell.

### Export formats

- `format=csv` or `format=xlsx` to export.

### Commercial usage

- `apikey` is optional and described as required only for commercial use to access reserved resources.
- Docs note the **server URL requires the prefix `customer-`** for commercial usage.

## Variables (high-level map)

The docs provide extensive variable lists. These are common, high-signal variables to start with:

- Forecast `hourly`:
  - `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`
  - `precipitation`, `rain`, `showers`, `snowfall`, `precipitation_probability`
  - `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`
  - `weather_code`, `cloud_cover`, `pressure_msl`, `visibility`

- Forecast `daily`:
  - `temperature_2m_max`, `temperature_2m_min`
  - `precipitation_sum`, `rain_sum`, `snowfall_sum`
  - `sunrise`, `sunset`, `daylight_duration`, `sunshine_duration`
  - `wind_speed_10m_max`, `wind_gusts_10m_max`

- Forecast `current`:
  - any hourly variable can be requested as current; docs mention current values are based on 15-minutely data.

## Response structure (single-location)

The docs show the canonical response shape:

- Top-level metadata:
  - `latitude`, `longitude`, `elevation`
  - `generationtime_ms`
  - `utc_offset_seconds`
  - `timezone`, `timezone_abbreviation`

- Variable blocks:
  - `current` (object): values for requested current variables + `time` and `interval` (seconds)
  - `hourly` (object): `time[]` + arrays for each requested hourly variable
  - `hourly_units` (object): unit per hourly variable
  - `daily` / `daily_units` analogous

## WMO weather codes

- `weather_code` uses WMO interpretation codes.
- See: `references/weather-codes.md`.

## Error handling

If URL parameters are invalid or variable names are misspelled, the API returns HTTP 400 with a JSON object:

```json
{
  "error": true,
  "reason": "Cannot initialize WeatherVariable from invalid String value ..."
}
```

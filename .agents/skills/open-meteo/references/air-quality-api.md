# Open-Meteo Air Quality API (in-scope)

Source of truth: https://open-meteo.com/en/docs/air-quality-api

## Base URL

- `https://air-quality-api.open-meteo.com/v1/air-quality`

## Core query parameters

### Required

- `latitude` (float)
- `longitude` (float)

### Variable selection

- `hourly` (string array): comma-separated or repeated `&hourly=` parameters.
- `current` (string array): current-condition air-quality variables.

### Domain selection

- `domains` (string, default `auto`)
  - `auto`: combine both domains automatically.
  - `cams_europe`: European domain.
  - `cams_global`: global domain.

Docs note: European and global domains are not coupled and may show different forecasts.

### Time controls

- `timezone` (string, default `GMT`)
  - Supports TZ database names.
  - `timezone=auto` resolves coordinates to local timezone.

- `timeformat` (string, default `iso8601`)
  - `iso8601` or `unixtime`.
  - If `unixtime`: timestamps are GMT+0; apply `utc_offset_seconds` to derive correct local dates.

- `forecast_days` (int 0–7, default 5)
- `past_days` (int 0–92, default 0)

- Alternative timestep control:
  - `forecast_hours`, `past_hours`

- Explicit time interval:
  - `start_date`, `end_date` (YYYY-MM-DD)
  - `start_hour`, `end_hour` (YYYY-MM-DDThh:mm)

### Grid cell selection

- `cell_selection` (string, default `nearest`)
  - `nearest`, `land`, `sea`.

### Export formats

- `format=csv` or `format=xlsx` to export.

### Commercial usage

- `apikey` is optional; docs describe it as required only for commercial use to access reserved resources.
- Docs note the server URL requires the prefix `customer-` for commercial usage.

## Hourly variables (docs list)

Common pollutants and indices:

- Particulate matter: `pm10`, `pm2_5`
- Gases: `carbon_monoxide`, `nitrogen_dioxide`, `sulphur_dioxide`, `ozone`
- AQI (European):
  - `european_aqi` (consolidated max)
  - `european_aqi_pm2_5`, `european_aqi_pm10`, `european_aqi_nitrogen_dioxide`, `european_aqi_ozone`, `european_aqi_sulphur_dioxide`
- AQI (United States):
  - `us_aqi` (consolidated max)
  - `us_aqi_pm2_5`, `us_aqi_pm10`, `us_aqi_nitrogen_dioxide`, `us_aqi_ozone`, `us_aqi_sulphur_dioxide`, `us_aqi_carbon_monoxide`

Pollen variables (Europe only, during pollen season with 4 days forecast):

- `alder_pollen`, `birch_pollen`, `grass_pollen`, `mugwort_pollen`, `olive_pollen`, `ragweed_pollen`

Other hourly variables called out in the docs UI include:

- `carbon_dioxide`, `aerosol_optical_depth`, `dust`, `uv_index`, `uv_index_clear_sky`, `ammonia`, `methane`

## European AQI scale (docs)

- 0–20: good
- 20–40: fair
- 40–60: moderate
- 60–80: poor
- 80–100: very poor
- >100: extremely poor

Docs note: PM uses a 24-hour rolling average; gases use hourly values.

### EU thresholds table (from docs)

| Pollutant (μg/m³) | Timespan | Good | Fair | Moderate | Poor | Very poor | Extremely poor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PM2.5 | 24h | 0-10 | 10-20 | 20-25 | 25-50 | 50-75 | 75-800 |
| PM10 | 24h | 0-20 | 20-40 | 40-50 | 50-100 | 100-150 | 150-1200 |
| NO2 | 1h | 0-40 | 40-90 | 90-120 | 120-230 | 230-340 | 340-1000 |
| O3 | 1h | 0-50 | 50-100 | 100-130 | 130-240 | 240-380 | 380-800 |
| SO2 | 1h | 0-100 | 100-200 | 200-350 | 350-500 | 500-750 | 750-1250 |

## US AQI scale (docs)

- 0–50: good
- 51–100: moderate
- 101–150: unhealthy for sensitive groups
- 151–200: unhealthy
- 201–300: very unhealthy
- 301–500: hazardous

### US thresholds table (from docs)

| Pollutant | Timespan | Good | Moderate | Unhealthy for Sensitive Groups | Unhealthy | Very Unhealthy | Hazardous | |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O3 (ppb) | 8h | 0-55 | 55-70 | 70-85 | 85-105 | 105-200 | - | - |
| O3 (ppb) | 1h | - | - | 125-165 | 165-205 | 205-405 | 405-505 | 505-605 |
| PM2.5 (μg/m³) | 24h | 0-12 | 12-35.5 | 35.5-55.5 | 55.5-150.5 | 150.5-250.5 | 250.5-350.5 | 350.5-500.5 |
| PM10 (μg/m³) | 24h | 0-55 | 55-155 | 155-255 | 255-355 | 355-425 | 425-505 | 505-605 |
| CO (ppm) | 8h | 0-4.5 | 4.5-9.5 | 9.5-12.5 | 12.5-15.5 | 15.5-30.5 | 30.5-40.5 | 40.5-50.5 |
| SO2 (ppb) | 1h | 0-35 | 35-75 | 75-185 | 185-305 | - | - | - |
| SO2 (ppb) | 24h | - | - | - | - | 305-605 | 605-805 | 805-1005 |
| NO2 (ppb) | 1h | 0-54 | 54-100 | 100-360 | 360-650 | 650-1250 | 1250-1650 | 1650-2050 |

## Response structure (single-location)

The docs show the canonical response shape:

- `latitude`, `longitude`, `elevation`
- `generationtime_ms`
- `utc_offset_seconds`
- `timezone`, `timezone_abbreviation`
- `hourly` (object): `time[]` + arrays for each requested hourly variable
- `hourly_units` (object): unit per hourly variable

(If `current` was requested, a `current` object is included.)

## Error handling

The docs show JSON error objects returned with HTTP 400:

```json
{
  "error": true,
  "reason": "Cannot initialize WeatherVariable from invalid String value ..."
}
```

## Attribution / acknowledgement (docs)

Docs require users to provide attribution to:

- CAMS ENSEMBLE data provider, and
- Open-Meteo

See the “Citation & Acknowledgement” section on the Air Quality docs page.

---
name: open-meteo
description: "Integrate Open-Meteo's comprehensive suite of weather APIs: Forecast, Historical, Air Quality, Geocoding, Marine, Flood, Elevation, Climate, Seasonal, and Ensemble models. Enables query design, variable selection, timezone/timeformat/units, multi-location batching, and robust error handling. Keywords: Open-Meteo, Forecast, Historical, Air Quality, Geocoding, Marine, Flood, Elevation, Climate, Seasonal, Ensemble, API, weather, MCP."
version: "1.5.0"
release_date: "2026-02-13"
---

# Open Meteo

## When to use

- You need **weather forecasts** (hourly/daily/current) for any location.
- You need **historical weather data** for a specific date range.
- You need **air quality** or **pollen** forecasts.
- You need to get **geographic coordinates** and timezone from a place name (geocoding).
- You need specialized data like **marine/wave forecasts**, **river flood data**, **elevation data**, or long-term **seasonal and climate projections**.
- You need to query specific **weather models** or **ensemble forecasts**.
- You need a deterministic guide for query parameters, response parsing, and error handling for any Open-Meteo API.

## Goal

Provide a reliable, production-friendly way to call the full range of Open-Meteo APIs, choose variables, control time/units/timezone, and parse responses consistently.

## Steps

1.  **Pick the correct API and base URL**

    -   **Forecast**: `https://api.open-meteo.com/v1/forecast` (and model-specific endpoints like `/v1/gfs`)
    -   **Historical**: `https://archive-api.open-meteo.com/v1/archive`
    -   **Air Quality**: `https://air-quality-api.open-meteo.com/v1/air-quality`
    -   **Geocoding**: `https://geocoding-api.open-meteo.com/v1/search`
    -   **Marine/Ocean**: `https://marine-api.open-meteo.com/v1/marine`
    -   **Flood**: `https://flood-api.open-meteo.com/v1/flood`
    -   **Seasonal**: `https://seasonal-api.open-meteo.com/v1/seasonal`
    -   **Ensemble**: `https://ensemble-api.open-meteo.com/v1/ensemble`
    -   **Elevation/Climate**: `https://api.open-meteo.com/v1/elevation` or `/v1/climate`

2.  **Resolve coordinates (if you only have a name)**

    -   Call the Geocoding API (`/v1/search`) with `name` to get `latitude`, `longitude`, and `timezone`.

3.  **Design your time axis**

    -   Use `timezone` (e.g., `auto` or `Europe/Berlin`), which is required for `daily` aggregations.
    -   Choose `timeformat` (`iso8601` or `unixtime`). Remember `unixtime` is always UTC and requires manual offset calculation for local time.
    -   Specify a time range using `forecast_days`/`past_days` or `start_date`/`end_date`.

4.  **Choose variables minimally**

    -   Request only the variables you need via `hourly=...`, `daily=...`, etc. to reduce payload size.
    -   Keep variable names exact; typos will result in a JSON error response.

5.  **Choose units and models deliberately**

    -   Specify units like `temperature_unit`, `wind_speed_unit`, and `precipitation_unit`.
    -   For forecasts, select specific weather models via the `models=...` parameter or by using a model-specific endpoint (e.g., `/v1/dwd-icon`).

6.  **Implement robust request/response handling**

    -   Handle both HTTP-level errors (e.g., 404, 500) and API-level JSON errors (`{"error": true, "reason": "..."}`).
    -   If you query for multiple locations (comma-separated coordinates), the JSON response will be a list of objects instead of a single object.

## Best Practices

-   **Check Timezones**: Do not omit `timezone` when requesting `daily` variables.
-   **Handle `unixtime` Correctly**: Do not assume `unixtime` timestamps are local time; they are GMT+0 and require `utc_offset_seconds` for adjustment.
-   **Error Handling**: Do not silently ignore `{"error": true}` responses; fail fast with the provided `reason`.
-   **Minimal Queries**: Do not request huge variable sets by default; keep queries minimal to reduce payload and avoid accidental overuse.

## Definition of done

- You can geocode a place name and obtain coordinates/timezone.
- You can fetch data for Forecast, Air Quality, and Historical APIs.
- You can fetch data from at least one other specialized API (e.g., Marine, Flood, Elevation).
- Your client code handles both HTTP-level failures and JSON-level `error: true` with clear messages.
- Attribution requirements from the docs are captured for Air Quality (CAMS) and Geocoding (GeoNames).

## Links

-   **Official Docs**:
    -   [Weather Forecast](https://open-meteo.com/en/docs)
    -   [Historical Weather](https://open-meteo.com/en/docs/historical-weather-api)
    -   [Air Quality](https://open-meteo.com/en/docs/air-quality-api)
    -   [Geocoding](https://open-meteo.com/en/docs/geocoding-api)
    -   [Marine Weather](https://open-meteo.com/en/docs/marine-weather-api)
    -   [Flood Forecast](https://open-meteo.com/en/docs/flood-api)
    -   [Elevation](https://open-meteo.com/en/docs/elevation-api)
    -   [Climate Projections](https://open-meteo.com/en/docs/climate-api)
    -   [Ensemble Forecasts](https://open-meteo.com/en/docs/ensemble-api)
    -   [Seasonal Forecasts](https://open-meteo.com/en/docs/seasonal-forecast-api)
-   **Skill References**:
    -   `references/forecast-api.md`
    -   `references/models.md`
    -   `references/weather-codes.md`
    -   `references/air-quality-api.md`
    -   `references/geocoding-api.md`
    -   `references/examples.md`
    -   `references/historical-weather-api.md`
    -   `references/marine-weather-api.md`
    -   `references/flood-forecast-api.md`
    -   `references/elevation-api.md`
    -   `references/seasonal-forecast-api.md`
    -   `references/climate-projection-api.md`
    -   `references/ensemble-forecast-api.md`

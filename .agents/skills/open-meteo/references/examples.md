# Examples (Geocoding → Forecast / Air Quality)

All examples are derived from the official docs pages:

- https://open-meteo.com/en/docs
- https://open-meteo.com/en/docs/air-quality-api
- https://open-meteo.com/en/docs/geocoding-api

## Python (httpx) — geocode then forecast

```python
from __future__ import annotations

from typing import Any

import httpx


def _raise_if_open_meteo_error(payload: dict[str, Any]) -> None:
    if payload.get("error") is True:
        reason = payload.get("reason")
        raise RuntimeError(f"Open-Meteo error: {reason}")


def geocode(name: str, *, language: str = "en", count: int = 1) -> dict[str, Any]:
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": name, "language": language, "count": count, "format": "json"}

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    _raise_if_open_meteo_error(data)

    results = data.get("results")
    if not results:
        raise ValueError(f"No geocoding results for: {name}")

    return results[0]


def forecast(latitude: float, longitude: float, timezone: str) -> dict[str, Any]:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,precipitation,weather_code",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "current": "temperature_2m,wind_speed_10m",
        "timezone": timezone,  # daily requires timezone per docs
        "forecast_days": 2,
    }

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    _raise_if_open_meteo_error(data)
    return data


place = geocode("Berlin", language="en", count=1)
lat = float(place["latitude"])
lon = float(place["longitude"])
tz = str(place.get("timezone") or "GMT")

payload = forecast(lat, lon, tz)
print(payload["timezone"], payload["hourly_units"].get("temperature_2m"))
print(payload["hourly"]["time"][0], payload["hourly"]["temperature_2m"][0])
```

## Python (httpx) — air quality for the same point

```python
from __future__ import annotations

from typing import Any

import httpx


def _raise_if_open_meteo_error(payload: dict[str, Any]) -> None:
    if payload.get("error") is True:
        raise RuntimeError(f"Open-Meteo error: {payload.get('reason')}")


def air_quality(latitude: float, longitude: float, timezone: str) -> dict[str, Any]:
    url = "https://air-quality-api.open-meteo.com/v1/air-quality"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "pm10,pm2_5,european_aqi,us_aqi",
        "current": "pm10,pm2_5,european_aqi",
        "timezone": timezone,
        "forecast_days": 2,
        "domains": "auto",
    }

    with httpx.Client(timeout=10.0) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    _raise_if_open_meteo_error(data)
    return data
```

## Notes

- Variable names must match the docs exactly: e.g., `pm2_5` (not `pm2.5`).
- If you set `timeformat=unixtime`, timestamps are in GMT+0; use `utc_offset_seconds` to derive local dates.
- If you request `daily=...` on the Forecast API, you must set `timezone` (per docs).

# Ensemble Forecast API

The Ensemble Forecast API provides access to weather forecasts from multiple models or multiple runs of the same model. This approach helps to quantify forecast uncertainty.

## Endpoint

`https://ensemble-api.open-meteo.com/v1/ensemble`

## Required Parameters

-   `latitude`, `longitude`: Floating-point numbers for the WGS84 coordinates.
-   `models`: A comma-separated list of ensemble weather models to query.

## Optional Parameters

-   `hourly` / `daily`: A comma-separated list of variables to retrieve. At least one is required.
-   `forecast_days`: Number of forecast days. Default is 7, but can be up to 35 depending on the model.
-   `past_days`: Number of past days to include. Default is 0.
-   `timezone`: Timezone for returning timestamps. Defaults to `GMT`. It's recommended to use `timezone=auto`.
-   `temperature_unit`: `celsius` (default) or `fahrenheit`.
-   `wind_speed_unit`: `kmh` (default), `ms`, `mph`, `kn`.
-   `precipitation_unit`: `mm` (default) or `inch`.

## Hourly Variables

A selection of available hourly variables. Note that the response will include values for each ensemble member (e.g., `temperature_2m_member_01`, `temperature_2m_member_02`, etc.).
-   `temperature_2m`
-   `relative_humidity_2m`
-   `precipitation`
-   `rain`
-   `snowfall`
-   `weather_code`
-   `pressure_msl`
-   `cloud_cover`
-   `wind_speed_10m`
-   `wind_direction_10m`
-   `wind_gusts_10m`
-   `cape`
-   `snow_depth`

## Daily Variables

A selection of available daily aggregated variables:
-   `temperature_2m_max`
-   `temperature_2m_min`
-   `temperature_2m_mean`
-   `precipitation_sum`
-   `rain_sum`
-   `snowfall_sum`
-   `wind_speed_10m_max`
-   `wind_gusts_10m_max`

## Available Models

A selection of available ensemble models:
-   `gfs_seamless`
-   `icon_global`
-   `icon_eu`
-   `ecmwf_ifs025`
-   `gfs013`
-   `meteofrance_arome_france_hd`
-   `meteofrance_arpege_europe`

## Example

Get the ensemble forecast for hourly temperature and precipitation for London for the next 2 days using the global ICON and GFS models.

```
https://ensemble-api.open-meteo.com/v1/ensemble?latitude=51.50&longitude=-0.12&hourly=temperature_2m,precipitation&models=icon_global,gfs013&forecast_days=2&timezone=auto
```

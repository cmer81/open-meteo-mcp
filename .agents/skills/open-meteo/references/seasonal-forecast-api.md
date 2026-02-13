# Seasonal Forecast API

The Seasonal Forecast API provides long-range forecasts up to 7 months ahead, based on models like the ECMWF SEAS5. It is useful for understanding temperature and precipitation anomalies over a longer period.

## Endpoint

`https://seasonal-api.open-meteo.com/v1/seasonal`

## Required Parameters

-   `latitude`, `longitude`: Floating-point numbers for the WGS84 coordinates.

## Optional Parameters

-   `hourly` / `daily`: A comma-separated list of variables to retrieve. At least one is required. Note: The "hourly" data is typically aggregated at a 6-hourly interval for seasonal forecasts.
-   `forecast_days`: Number of forecast days. Default is for 6 months.
-   `past_days`: Number of past days to include.
-   `start_date` / `end_date`: The specific time interval for the data, in `YYYY-MM-DD` format.
-   `timezone`: Timezone for returning timestamps. Defaults to `GMT`. It's recommended to use `timezone=auto`.
-   `temperature_unit`: `celsius` (default) or `fahrenheit`.
-   `wind_speed_unit`: `kmh` (default), `ms`, `mph`, `kn`.
-   `precipitation_unit`: `mm` (default) or `inch`.

## 6-Hourly Variables

A selection of available 6-hourly variables:
-   `temperature_2m`
-   `relative_humidity_2m`
-   `dew_point_2m`
-   `apparent_temperature`
-   `pressure_msl`
-   `total_cloud_cover`
-   `precipitation`
-   `rain`
-   `snowfall`
-   `weather_code`
-   `wind_speed_10m`
-   `wind_direction_10m`
-   `soil_temperature_0_to_7cm`

## Daily Variables

A selection of available daily aggregated variables:
-   `temperature_2m_max`
-   `temperature_2m_min`
-   `temperature_2m_mean`
-   `precipitation_sum`
-   `rain_sum`
-   `snowfall_sum`

## Example

Get the mean daily temperature forecast for the next 3 months for Paris.

```
https://seasonal-api.open-meteo.com/v1/seasonal?latitude=48.85&longitude=2.35&daily=temperature_2m_mean&forecast_days=92&timezone=auto
```

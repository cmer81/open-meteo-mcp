# Historical Weather API

The Historical Weather API provides weather data from the past, based on reanalysis models like ERA5. It is ideal for accessing consistent, long-term weather records.

## Endpoint

`https://archive-api.open-meteo.com/v1/archive`

## Required Parameters

-   `latitude`, `longitude`: Floating-point numbers for the WGS84 coordinates. Multiple locations can be specified as a comma-separated list.
-   `start_date`: The start date for the time interval, in `YYYY-MM-DD` format.
-   `end_date`: The end date for the time interval, in `YYYY-MM-DD` format.
-   `hourly` or `daily`: You must specify at least one of these with a comma-separated list of weather variables.

## Optional Parameters

-   `temperature_unit`: `celsius` (default) or `fahrenheit`.
-   `wind_speed_unit`: `kmh` (default), `ms`, `mph`, `kn`.
-   `precipitation_unit`: `mm` (default) or `inch`.
-   `timezone`: Timezone for returning timestamps (e.g., `America/New_York`). Defaults to `GMT` if not specified. It is recommended to use `timezone=auto` to get the local timezone.
-   `models`: Allows specifying reanalysis models. `ERA5` is often used for a globally complete dataset from 1940 onwards.

## Hourly Weather Variables

A selection of available hourly variables:
-   `temperature_2m`
-   `relative_humidity_2m`
-   `dew_point_2m`
-   `apparent_temperature`
-   `precipitation`
-   `rain`
-   `snowfall`
-   `snow_depth`
-   `weather_code`
-   `pressure_msl`
-   `surface_pressure`
-   `cloud_cover`
-   `wind_speed_10m`
-   `wind_direction_10m`
-   `soil_temperature_0_to_7cm`
-   `soil_moisture_0_to_7cm`

## Daily Weather Variables

A selection of available daily aggregated variables:
-   `weather_code_mean`
-   `temperature_2m_max`
-   `temperature_2m_min`
-   `temperature_2m_mean`
-   `apparent_temperature_max`
-   `apparent_temperature_min`
-   `apparent_temperature_mean`
-   `sunrise`
-   `sunset`
-   `precipitation_sum`
-   `rain_sum`
-   `snowfall_sum`
-   `precipitation_hours`
-   `wind_speed_10m_max`
-   `wind_gusts_10m_max`
-   `wind_direction_10m_dominant`
-   `shortwave_radiation_sum`
-   `et0_fao_evapotranspiration`

## Example

Get daily maximum temperature and precipitation sum for Berlin from January 1st to 7th, 2023.

```
https://archive-api.open-meteo.com/v1/archive?latitude=52.52&longitude=13.41&start_date=2023-01-01&end_date=2023-01-07&daily=temperature_2m_max,precipitation_sum&timezone=Europe/Berlin
```

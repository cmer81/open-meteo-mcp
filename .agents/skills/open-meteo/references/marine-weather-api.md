# Marine Weather API

The Marine Weather API provides detailed ocean and wave forecasts, essential for marine activities.

## Endpoint

`https://marine-api.open-meteo.com/v1/marine`

## Required Parameters

-   `latitude`, `longitude`: Floating-point numbers for the WGS84 coordinates. Multiple locations can be specified as a comma-separated list.

## Optional Parameters

-   `hourly`: A comma-separated list of marine weather variables to retrieve for each hour.
-   `daily`: A comma-separated list of daily aggregated marine variables. If used, `timezone` is required.
-   `current`: A comma-separated list of variables for the current marine conditions.
-   `timezone`: Timezone for returning timestamps (e.g., `America/New_York`). Defaults to `GMT`. It's recommended to use `timezone=auto` for the local timezone.
-   `forecast_days`: Number of days for the forecast, from 1 to 16. Default is 7.
-   `timeformat`: `iso8601` (default) or `unixtime`.

## Hourly Marine Variables

A selection of available hourly variables:
-   `wave_height`
-   `wave_direction`
-   `wave_period`
-   `wind_wave_height`
-   `wind_wave_direction`
-   `wind_wave_period`
-   `swell_wave_height`
-   `swell_wave_direction`
-   `swell_wave_period`
-   `sea_surface_temperature`
-   `ocean_current_velocity`
-   `ocean_current_direction`

## Daily Marine Variables

A selection of available daily aggregated variables:
-   `wave_height_max`
-   `wave_direction_dominant`
-   `wave_period_max`
-   `wind_wave_height_max`
-   `wind_wave_direction_dominant`
-   `wind_wave_period_max`
-   `swell_wave_height_max`
-   `swell_wave_direction_dominant`
-   `swell_wave_period_max`

## Example

Get daily max wave height for a location in the North Atlantic for the next 5 days.

```
https://marine-api.open-meteo.com/v1/marine?latitude=54.5&longitude=-15.5&daily=wave_height_max&forecast_days=5&timezone=auto
```

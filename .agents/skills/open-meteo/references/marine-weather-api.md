# Marine Weather API

Source: https://open-meteo.com/en/docs/marine-weather-api

This API provides hourly wave and ocean forecasts at up to 5 km resolution.

## Base URL

`https://marine-api.open-meteo.com/v1/marine`

## Required Parameters

- `latitude`, `longitude`: Floating-point WGS84 coordinates. Multiple coordinates can be comma-separated.

## Optional Parameters

### Variable Selection
- `hourly`: A comma-separated list of hourly marine variables to retrieve.
- `daily`: A comma-separated list of daily aggregated marine variables. `timezone` is required.
- `current`: A comma-separated list of variables for current marine conditions.
- `minutely_15`: A comma-separated list of 15-minutely marine variables.

### Time Controls
- `timezone` (string, default `GMT`): Use a TZ database name or `auto`.
- `timeformat` (string, default `iso8601`): `iso8601` or `unixtime`.
- `forecast_days` (int 0-8, default 5): Number of days of forecast to return.
- `past_days` (int 0-92, default 0): Number of past days to return.
- `forecast_hours`, `past_hours`: Fine-grained control over the number of hourly timesteps.
- `forecast_minutely_15`, `past_minutely_15`: Fine-grained control over the number of 15-minutely timesteps.
- `start_date`, `end_date`: `YYYY-MM-DD` format to specify a time interval.
- `start_hour`, `end_hour`: `YYYY-MM-DDThh:mm` for hourly data intervals.

### Units
- `length_unit` (default `metric`): `metric` or `imperial`.
- `velocity_unit` (default `kmh`): `ms`, `mph`, `kn`.

### Models & Grid Selection
- `models`: Manually select one or more weather models. Defaults to `best_match`.
- `cell_selection` (string, default `sea`): `land`, `sea`, or `nearest`.

### Other
- `apikey` (string): Required for commercial use.

## Weather Models
- `best_match` (Default)
- `meteofrance_wave`
- `meteofrance_ocean_currents`
- `dwd_ewam`
- `dwd_gwam`
- `ecmwf_wam`
- `ecmwf_wam_025`
- `gfs_wave_025`
- `gfs_wave_016`
- `era5_ocean`

## Hourly Marine Variables
- `wave_height`
- `wave_direction`
- `wave_period`
- `wave_peak_period`
- `wind_wave_height`
- `wind_wave_direction`
- `wind_wave_period`
- `wind_wave_peak_period`
- `swell_wave_height`
- `swell_wave_direction`
- `swell_wave_period`
- `swell_wave_peak_period`
- `secondary_swell_wave_height`
- `secondary_swell_wave_period`
- `secondary_swell_wave_direction`
- `tertiary_swell_wave_height`
- `tertiary_swell_wave_period`
- `tertiary_swell_wave_direction`
- `sea_level_height_msl`
- `sea_surface_temperature`
- `ocean_current_velocity`
- `ocean_current_direction`
- `invert_barometer_height`

## Daily Marine Variables
- `wave_height_max`
- `wave_direction_dominant`
- `wave_period_max`
- `wind_wave_height_max`
- `wind_wave_direction_dominant`
- `wind_wave_period_max`
- `wind_wave_peak_period_max`
- `swell_wave_height_max`
- `swell_wave_direction_dominant`
- `swell_wave_period_max`
- `swell_wave_peak_period_max`

## 15-Minutely Marine Variables
*Note: Only available in Central Europe and North America.*
- `ocean_current_velocity`
- `ocean_current_direction`
- `sea_level_height_msl`

## Current Conditions
Any hourly variable can be requested for current conditions.

## Example
Get the daily max wave height for a location in the North Atlantic for the next 5 days.
```
https://marine-api.open-meteo.com/v1/marine?latitude=54.5&longitude=-15.5&daily=wave_height_max&forecast_days=5&timezone=auto
```

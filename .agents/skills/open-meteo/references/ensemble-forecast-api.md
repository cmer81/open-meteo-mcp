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
-   `forecast_hours`: Number of forecast hours.
-   `past_hours`: Number of past hours to include.
-   `forecast_minutely_15`: Number of forecast 15-minute intervals.
-   `past_minutely_15`: Number of past 15-minute intervals to include.
-   `start_hour`, `end_hour`: The time interval to get weather data for hourly data. Time must be specified as an ISO8601 date (e.g., `2022-06-30T12:00`).
-   `start_minutely_15`, `end_minutely_15`: The time interval to get weather data for 15-minutely data. Time must be specified as an ISO8601 date (e.g., `2022-06-30T12:00`).
-   `elevation`: The elevation used for statistical downscaling.
-   `timeformat`: `iso8601` (default) or `unixtime`.
-   `start_date`, `end_date`: The time interval to get weather data for. A day must be specified as `YYYY-MM-DD`.
-   `timezone`: Timezone for returning timestamps. Defaults to `GMT`. It's recommended to use `timezone=auto`.
-   `temperature_unit`: `celsius` (default) or `fahrenheit`.
-   `wind_speed_unit`: `kmh` (default), `ms`, `mph`, `kn`.
-   `precipitation_unit`: `mm` (default) or `inch`.
-   `cell_selection`: `land` or `sea`.
-   `pressure_level_variables`: A comma-separated list of pressure level variables to retrieve.
-   `panel_tilt`: Panel Tilt (0° horizontal).
-   `panel_azimuth`: Panel Azimuth (0° S, -90° E, 90° W, ±180° N).
-   `apikey`: Only required for commercial use to access reserved API resources for customers.

## Hourly Variables

A selection of available hourly variables. Note that the response will include values for each ensemble member.
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
-   `cloud_cover_low`
-   `cloud_cover_mid`
-   `cloud_cover_high`
-   `visibility`
-   `wind_speed_10m`
-   `wind_direction_10m`
-   `wind_gusts_10m`
-   `wind_speed_80m`
-   `wind_direction_80m`
-   `wind_speed_100m`
-   `wind_direction_100m`
-   `wind_speed_120m`
-   `wind_direction_120m`
-   `surface_temperature`
-   `soil_temperature_0_to_10cm`
-   `soil_temperature_10_to_40cm`
-   `soil_temperature_40_to_100cm`
-   `soil_temperature_100_to_200cm`
-   `soil_temperature_0_to_7cm`
-   `soil_temperature_7_to_28cm`
-   `soil_temperature_28_to_100cm`
-   `soil_temperature_100_to_255cm`
-   `soil_moisture_0_to_10cm`
-   `soil_moisture_10_to_40cm`
-   `soil_moisture_40_to_100cm`
-   `soil_moisture_100_to_400cm`
-   `soil_moisture_0_to_7cm`
-   `soil_moisture_7_to_28cm`
-   `soil_moisture_28_to_100cm`
-   `soil_moisture_100_to_255cm`
-   `cape`
-   `et0_fao_evapotranspiration`
-   `evapotranspiration`
-   `vapour_pressure_deficit`
-   `shortwave_radiation`
-   `shortwave_radiation_instant`
-   `direct_radiation`
-   `direct_normal_irradiance`
-   `diffuse_radiation`
-   `global_tilted_irradiance`
-   `direct_radiation_instant`
-   `diffuse_radiation_instant`
-   `global_tilted_irradiance_instant`
-   `uv_index`
-   `uv_index_clear_sky`
-   `temperature_3h_min_2m`
-   `temperature_3h_max_2m`
-   `wet_bulb_temperature_2m`
-   `convective_inhibition`
-   `freezing_level_height`
-   `snowfall_height`
-   `sunshine_duration`
-   `snowfall_water_equivalent`
-   `snow_depth_water_equivalent`

## Daily Variables

A selection of available daily aggregated variables:
-   `temperature_2m_mean`
-   `temperature_2m_min`
-   `temperature_2m_max`
-   `apparent_temperature_mean`
-   `apparent_temperature_min`
-   `apparent_temperature_max`
-   `wind_speed_10m_mean`
-   `wind_speed_10m_min`
-   `wind_speed_10m_max`
-   `wind_direction_10m_dominant`
-   `wind_gusts_10m_mean`
-   `wind_gusts_10m_min`
-   `wind_gusts_10m_max`
-   `wind_speed_100m_mean`
-   `wind_speed_100m_min`
-   `wind_speed_100m_max`
-   `wind_direction_100m_dominant`
-   `precipitation_sum`
-   `precipitation_hours`
-   `rain_sum`
-   `snowfall_sum`
-   `pressure_msl_mean`
-   `pressure_msl_min`
-   `pressure_msl_max`
-   `surface_pressure_mean`
-   `surface_pressure_min`
-   `surface_pressure_max`
-   `cloud_cover_mean`
-   `cloud_cover_min`
-   `cloud_cover_max`
-   `relative_humidity_2m_mean`
-   `relative_humidity_2m_min`
-   `relative_humidity_2m_max`
-   `dew_point_2m_mean`
-   `dew_point_2m_min`
-   `dew_point_2m_max`
-   `cape_mean`
-   `cape_min`
-   `cape_max`
-   `shortwave_radiation_sum`

## Pressure Level Variables

Pressure level variables are available for the following levels:
-   **1000 hPa (110 m)**: `temperature_1000hPa`, `relative_humidity_1000hPa`, `dew_point_1000hPa`, `cloud_cover_1000hPa`, `wind_speed_1000hPa`, `wind_direction_1000hPa`, `vertical_velocity_1000hPa`, `geopotential_height_1000hPa`
-   **925 hPa (800 m)**: `temperature_925hPa`, `relative_humidity_925hPa`, `dew_point_925hPa`, `cloud_cover_925hPa`, `wind_speed_925hPa`, `wind_direction_925hPa`, `vertical_velocity_925hPa`, `geopotential_height_925hPa`
-   **850 hPa (1500 m)**: `temperature_850hPa`, `relative_humidity_850hPa`, `dew_point_850hPa`, `cloud_cover_850hPa`, `wind_speed_850hPa`, `wind_direction_850hPa`, `vertical_velocity_850hPa`, `geopotential_height_850hPa`
-   **700 hPa (3 km)**: `temperature_700hPa`, `relative_humidity_700hPa`, `dew_point_700hPa`, `cloud_cover_700hPa`, `wind_speed_700hPa`, `wind_direction_700hPa`, `vertical_velocity_700hPa`, `geopotential_height_700hPa`
-   **600 hPa (4.2 km)**: `temperature_600hPa`, `relative_humidity_600hPa`, `dew_point_600hPa`, `cloud_cover_600hPa`, `wind_speed_600hPa`, `wind_direction_600hPa`, `vertical_velocity_600hPa`, `geopotential_height_600hPa`
-   **500 hPa (5.6 km)**: `temperature_500hPa`, `relative_humidity_500hPa`, `dew_point_500hPa`, `cloud_cover_500hPa`, `wind_speed_500hPa`, `wind_direction_500hPa`, `vertical_velocity_500hPa`, `geopotential_height_500hPa`
-   **400 hPa (7.2 km)**: `temperature_400hPa`, `relative_humidity_400hPa`, `dew_point_400hPa`, `cloud_cover_400hPa`, `wind_speed_400hPa`, `wind_direction_400hPa`, `vertical_velocity_400hPa`, `geopotential_height_400hPa`
-   **300 hPa (9.2 km)**: `temperature_300hPa`, `relative_humidity_300hPa`, `dew_point_300hPa`, `cloud_cover_300hPa`, `wind_speed_300hPa`, `wind_direction_300hPa`, `vertical_velocity_300hPa`, `geopotential_height_300hPa`
-   **250 hPa (10.4 km)**: `temperature_250hPa`, `relative_humidity_250hPa`, `dew_point_250hPa`, `cloud_cover_250hPa`, `wind_speed_250hPa`, `wind_direction_250hPa`, `vertical_velocity_250hPa`, `geopotential_height_250hPa`
-   **200 hPa (11.8 km)**: `temperature_200hPa`, `relative_humidity_200hPa`, `dew_point_200hPa`, `cloud_cover_200hPa`, `wind_speed_200hPa`, `wind_direction_200hPa`, `vertical_velocity_200hPa`, `geopotential_height_200hPa`
-   **150 hPa (13.5 km)**: `temperature_150hPa`, `relative_humidity_150hPa`, `dew_point_150hPa`, `cloud_cover_150hPa`, `wind_speed_150hPa`, `wind_direction_150hPa`, `vertical_velocity_150hPa`, `geopotential_height_150hPa`
-   **100 hPa (15.8 km)**: `temperature_100hPa`, `relative_humidity_100hPa`, `dew_point_100hPa`, `cloud_cover_100hPa`, `wind_speed_100hPa`, `wind_direction_100hPa`, `vertical_velocity_100hPa`, `geopotential_height_100hPa`
-   **50 hPa (19.3 km)**: `temperature_50hPa`, `relative_humidity_50hPa`, `dew_point_50hPa`, `cloud_cover_50hPa`, `wind_speed_50hPa`, `wind_direction_50hPa`, `vertical_velocity_50hPa`, `geopotential_height_50hPa`



## Available Models

A selection of available ensemble models:
-   `icon_seamless_eps`
-   `icon_global_eps`
-   `icon_eu_eps`
-   `icon_d2_eps`
-   `gfs_seamless`
-   `gfs_ensemble_025`
-   `gfs_ensemble_05`
-   `aigefs_025`
-   `ecmwf_ifs_025`
-   `ecmwf_aifs_025`
-   `gem_global`
-   `bom_access_global`
-   `ukmo_global_20km`
-   `ukmo_uk_2km`
-   `meteoswiss_icon_ch1`
-   `meteoswiss_icon_ch2`

## Example

Get the ensemble forecast for hourly temperature and precipitation for London for the next 2 days using the global ICON and GFS models.

```
https://ensemble-api.open-meteo.com/v1/ensemble?latitude=51.50&longitude=-0.12&hourly=temperature_2m,precipitation&models=icon_global,gfs_global&forecast_days=2&timezone=auto
```

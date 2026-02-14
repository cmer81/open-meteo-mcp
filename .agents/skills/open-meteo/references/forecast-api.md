# Open-Meteo Weather Forecast API

Source: https://open-meteo.com/en/docs

This API provides seamless integration of high-resolution weather models with up to a 16-day forecast.

## Base URL

`https://api.open-meteo.com/v1/forecast`

## Required Parameters

- `latitude`, `longitude`: Floating-point WGS84 coordinates. Multiple coordinates can be comma-separated.

## Optional Parameters

### Variable Selection
- `hourly`: A comma-separated list of hourly weather variables to retrieve.
- `daily`: A comma-separated list of daily weather variable aggregations. `timezone` is required if `daily` is specified.
- `current`: A comma-separated list of variables for current conditions.
- `minutely_15`: A comma-separated list of 15-minutely weather variables.

### Time Controls
- `timezone` (string, default `GMT`): Use a TZ database name (e.g., `Europe/Berlin`) or `auto`.
- `timeformat` (string, default `iso8601`): `iso8601` or `unixtime`.
- `forecast_days` (int 0-16, default 7): Number of days of forecast to return.
- `past_days` (int 0-92, default 0): Number of past days to return.
- `forecast_hours`, `past_hours`: Fine-grained control over the number of hourly timesteps.
- `forecast_minutely_15`, `past_minutely_15`: Fine-grained control over the number of 15-minutely timesteps.
- `start_date`, `end_date`: `YYYY-MM-DD` format to specify a time interval.
- `start_hour`, `end_hour`: `YYYY-MM-DDThh:mm` for hourly data intervals.
- `start_minutely_15`, `end_minutely_15`: `YYYY-MM-DDThh:mm` for 15-minutely data intervals.

### Units
- `temperature_unit` (default `celsius`): `fahrenheit`.
- `wind_speed_unit` (default `kmh`): `ms`, `mph`, `kn`.
- `precipitation_unit` (default `mm`): `inch`.

### Models & Grid Selection
- `models` (string array, default `auto`): Manually select weather models.
- `elevation` (float): The elevation used for statistical downscaling. `elevation=nan` disables it.
- `cell_selection` (string, default `land`): `land`, `sea`, or `nearest`.

### Other
- `apikey` (string): Required for commercial use.
- `panel_tilt` (float): Tilt for Global Tilted Radiation (GTI).
- `panel_azimuth` (float): Azimuth for Global Tilted Radiation (GTI).

## Weather Models
You can manually select from the following models:
- `ecmwf_ifs_hres_9km`
- `ecmwf_ifs_025`
- `ecmwf_aifs_025_single`
- `cma_grapes_global`
- `bom_access_global`
- `ncep_gfs_seamless`
- `ncep_gfs_global`
- `ncep_hrrr_us_conus`
- `ncep_nbm_us_conus`
- `ncep_nam_us_conus`
- `ncep_gfs_graphcast`
- `ncep_aigfs_025`
- `ncep_hgefs_025_ensemble_mean`
- `jma_seamless`
- `jma_msm`
- `jma_gsm`
- `kma_seamless`
- `kma_ldps`
- `kma_gdps`
- `dwd_icon_seamless`
- `dwd_icon_global`
- `dwd_icon_eu`
- `dwd_icon_d2`
- `gem_seamless`
- `gem_global`
- `gem_regional`
- `gem_hrdps_continental`
- `gem_hrdps_west`
- `meteofrance_seamless`
- `meteofrance_arpege_world`
- `meteofrance_arpege_europe`
- `meteofrance_arome_france`
- `meteofrance_arome_france_hd`
- `italiameteo_arpae_icon_2i`
- `met_norway_nordic_seamless`
- `met_norway_nordic`
- `knmi_seamless`
- `knmi_harmonie_arome_europe`
- `knmi_harmonie_arome_netherlands`
- `dmi_seamless`
- `dmi_harmonie_arome_europe`
- `uk_met_office_seamless`
- `uk_met_office_global_10km`
- `uk_met_office_uk_2km`
- `meteoswiss_icon_seamless`
- `meteoswiss_icon_ch1`
- `meteoswiss_icon_ch2`

## Hourly Variables
- `temperature_2m`
- `relative_humidity_2m`
- `dewpoint_2m`
- `apparent_temperature`
- `precipitation_probability`
- `precipitation`
- `rain`
- `showers`
- `snowfall`
- `snow_depth`
- `weather_code`
- `pressure_msl`
- `surface_pressure`
- `cloud_cover`
- `cloud_cover_low`
- `cloud_cover_mid`
- `cloud_cover_high`
- `visibility`
- `evapotranspiration`
- `et0_fao_evapotranspiration`
- `vapour_pressure_deficit`
- `wind_speed_10m`
- `wind_speed_80m`
- `wind_speed_120m`
- `wind_speed_180m`
- `wind_direction_10m`
- `wind_direction_80m`
- `wind_direction_120m`
- `wind_direction_180m`
- `wind_gusts_10m`
- `temperature_80m`
- `temperature_120m`
- `temperature_180m`
- `soil_temperature_0cm`
- `soil_temperature_6cm`
- `soil_temperature_18cm`
- `soil_temperature_54cm`
- `soil_moisture_0_to_1cm`
- `soil_moisture_1_to_3cm`
- `soil_moisture_3_to_9cm`
- `soil_moisture_9_to_27cm`
- `soil_moisture_27_to_81cm`
- `uv_index`
- `uv_index_clear_sky`
- `is_day`
- `sunshine_duration`
- `wet_bulb_temperature_2m`
- `total_column_integrated_water_vapour`
- `cape`
- `lifted_index`
- `convective_inhibition`
- `freezing_level_height`
- `boundary_layer_height_pbl`
- `shortwave_radiation`
- `direct_radiation`
- `diffuse_radiation`
- `direct_normal_irradiance`
- `global_tilted_irradiance`
- `terrestrial_radiation`
- `shortwave_radiation_instant`
- `direct_radiation_instant`
- `diffuse_radiation_instant`
- `direct_normal_irradiance_instant`
- `global_tilted_irradiance_instant`
- `terrestrial_radiation_instant`

## Daily Variables
- `weather_code`
- `temperature_2m_max`
- `temperature_2m_min`
- `apparent_temperature_max`
- `apparent_temperature_min`
- `sunrise`
- `sunset`
- `daylight_duration`
- `sunshine_duration`
- `uv_index_max`
- `uv_index_clear_sky_max`
- `rain_sum`
- `showers_sum`
- `snowfall_sum`
- `precipitation_sum`
- `precipitation_hours`
- `precipitation_probability_max`
- `wind_speed_10m_max`
- `wind_gusts_10m_max`
- `wind_direction_10m_dominant`
- `shortwave_radiation_sum`
- `et0_fao_evapotranspiration`
- `temperature_2m_mean`
- `apparent_temperature_mean`
- `cape_mean`, `cape_max`, `cape_min`
- `cloud_cover_mean`, `cloud_cover_max`, `cloud_cover_min`
- `dewpoint_2m_mean`, `dewpoint_2m_max`, `dewpoint_2m_min`
- `et0_fao_evapotranspiration_sum`
- `growing_degree_days_base_0_limit_50`
- `leaf_wetness_probability_mean`, `leaf_wetness_probability_max`, `leaf_wetness_probability_min`
- `precipitation_probability_mean`, `precipitation_probability_min`
- `relative_humidity_2m_mean`, `relative_humidity_2m_max`, `relative_humidity_2m_min`
- `snowfall_water_equivalent_sum`
- `pressure_msl_mean`, `pressure_msl_max`, `pressure_msl_min`
- `surface_pressure_mean`, `surface_pressure_max`, `surface_pressure_min`
- `updraft_max`
- `visibility_mean`, `visibility_max`, `visibility_min`
- `wind_gusts_10m_mean`, `wind_gusts_10m_min`
- `wind_speed_10m_mean`, `wind_speed_10m_min`
- `wet_bulb_temperature_2m_mean`, `wet_bulb_temperature_2m_max`, `wet_bulb_temperature_2m_min`
- `vapour_pressure_deficit_max`

## 15-Minutely Variables
*Note: Only available in Central Europe and North America.*
- `temperature_2m`
- `relative_humidity_2m`
- `dewpoint_2m`
- `apparent_temperature`
- `precipitation`
- `rain`
- `snowfall`
- `snowfall_height`
- `freezing_level_height`
- `sunshine_duration`
- `weather_code`
- `wind_speed_10m`, `wind_speed_80m`
- `wind_direction_10m`, `wind_direction_80m`
- `wind_gusts_10m`
- `visibility`
- `cape`
- `lightning_potential_index_lpi`
- `is_day`
- `shortwave_radiation`
- `direct_radiation`
- `diffuse_radiation`
- `direct_normal_irradiance`
- `global_tilted_irradiance`
- `terrestrial_radiation`
- `shortwave_radiation_instant`
- `direct_radiation_instant`
- `diffuse_radiation_instant`
- `direct_normal_irradiance_instant`
- `global_tilted_irradiance_instant`
- `terrestrial_radiation_instant`

## Current Weather
Any hourly variable can be requested. Current conditions are based on 15-minutely data.

## Pressure Level Variables
Available for levels: 1000, 975, 950, 925, 900, 850, 800, 700, 600, 500, 400, 300, 250, 200, 150, 100, 70, 50, 30 hPa.
- `temperature`
- `relative_humidity`
- `cloud_cover`
- `wind_speed`
- `wind_direction`
- `geopotential_height`

## WMO Weather Codes
See `references/weather-codes.md`.

## Error Handling
The API returns HTTP 400 with a JSON error object for invalid requests.
```json
{
  "error": true,
  "reason": "Cannot initialize WeatherVariable from invalid String value..."
}
```

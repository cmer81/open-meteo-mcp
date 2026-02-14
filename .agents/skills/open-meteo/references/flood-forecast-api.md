# Flood Forecast API

The Flood Forecast API provides river discharge forecasts from the Global Flood Awareness System (GloFAS). For a given coordinate, it returns data for the largest river within a 5 km radius.

## Endpoint

`https://flood-api.open-meteo.com/v1/flood`

## Required Parameters

-   `latitude`, `longitude`: Floating-point numbers for the WGS84 coordinates. Multiple locations can be specified as a comma-separated list.

## Optional Parameters

-   `daily`: A comma-separated list of daily flood variables to retrieve.
-   `forecast_days`: Number of forecast days to retrieve. Default is 92, maximum is 210.
-   `past_days`: Number of past days to include in the results. Default is 0.
-   `start_date` / `end_date`: The specific time interval for the data, in `YYYY-MM-DD` format.
-   `timeformat`: `iso8601` (default) or `unixtime`.
-   `cell_selection`: How grid-cells are selected. `land` (default), `sea`, or `nearest`.
-   `ensemble`: If true, all forecast ensemble members will be returned.
-   `apikey`: Only required for commercial use to access reserved API resources for customers.
-   `timezone`: Timezone for returning timestamps. Defaults to `GMT`. It's recommended to use `timezone=auto`.

## Daily Flood Variables

A selection of available daily variables:
-   `river_discharge`
-   `river_discharge_mean`
-   `river_discharge_median`
-   `river_discharge_max`
-   `river_discharge_min`
-   `river_discharge_p25`
-   `river_discharge_p75`

Note: When the `ensemble` parameter is set to true, individual river discharge ensemble members (e.g., `river_discharge_member_01`, `river_discharge_member_02`, etc.) will also be available.

## Data Sources

This API uses reanalysis and forecast data from the Global Flood Awareness System (GloFAS). By default, GloFAS version 4 with seamless data from 1984 until 7 months of forecast is used. GloFAS v3 data is also available.

## Example

Get the forecasted daily river discharge for the next 7 days for a location on the Danube river.

```
https://flood-api.open-meteo.com/v1/flood?latitude=48.208&longitude=16.373&daily=river_discharge&forecast_days=7
```

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

## Daily Flood Variables

A selection of available daily variables:
-   `river_discharge`
-   `river_discharge_mean`
-   `river_discharge_median`
-   `river_discharge_max`
-   `river_discharge_min`
-   `river_discharge_p25`
-   `river_discharge_p75`
-   `river_discharge_ensemble_member_01` (and other ensemble members)

## Example

Get the forecasted daily river discharge for the next 7 days for a location on the Danube river.

```
https://flood-api.open-meteo.com/v1/flood?latitude=48.208&longitude=16.373&daily=river_discharge&forecast_days=7
```

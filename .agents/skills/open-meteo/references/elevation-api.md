# Elevation API

The Elevation API provides the elevation in meters for a given set of coordinates based on a 90-meter digital elevation model.

## Endpoint

`https://api.open-meteo.com/v1/elevation`

## Required Parameters

-   `latitude`: A single floating-point number or a comma-separated list of WGS84 latitude coordinates.
-   `longitude`: A single floating-point number or a comma-separated list of WGS84 longitude coordinates.

Up to 100 coordinate pairs can be specified in a single request.

## Response

The API returns a JSON object with an `elevation` key. The value is an array of numbers, where each number is the elevation in meters for the corresponding coordinate pair in the request.

```json
{
  "elevation": [165, 30]
}
```

## Example

Get the elevation for Mont Blanc and Berlin.

```
https://api.open-meteo.com/v1/elevation?latitude=45.83,52.52&longitude=6.86,13.41
```

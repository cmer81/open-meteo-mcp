# Open-Meteo Geocoding API (in-scope)

Source of truth: https://open-meteo.com/en/docs/geocoding-api

## Base URL

- Search: `https://geocoding-api.open-meteo.com/v1/search`

Docs also mention IDs can be resolved via:

- Get by ID: `https://geocoding-api.open-meteo.com/v1/get?id=<id>`

## Search parameters

| Parameter | Required | Default | Notes |
| --- | --- | --- | --- |
| `name` | yes |  | Search string: location name or postal code |
| `count` | no | 10 | 1–100 allowed |
| `language` | no | `en` | Lower-cased; returns translated results if available |
| `format` | no | `json` | `json` or `protobuf` |
| `countryCode` | no |  | ISO-3166-1 alpha2 filter |
| `apikey` | no |  | Docs describe it as required only for commercial use (reserved resources) |

### Matching behavior (docs)

- empty string or 1 character → empty result
- 2 characters → exact matching only
- 3+ characters → fuzzy matching

## Response

On success, returns:

```json
{
  "results": [
    {
      "id": 2950159,
      "name": "Berlin",
      "latitude": 52.52437,
      "longitude": 13.41053,
      "elevation": 74.0,
      "feature_code": "PPLC",
      "country_code": "DE",
      "timezone": "Europe/Berlin",
      "population": 3426354,
      "postcodes": ["10967", "13347"],
      "country": "Deutschland",
      "admin1": "Berlin"
    }
  ]
}
```

Docs note:

- Empty fields are not returned (e.g., `admin4` may be missing).
- The schema includes administrative levels (`admin1..admin4`) and corresponding IDs.

## Error handling

Docs show HTTP 400 with a JSON error object, e.g.:

```json
{
  "error": true,
  "reason": "Parameter count must be between 1 and 100."
}
```

## Attribution (docs)

- Location data based on GeoNames
- Country flags from HatScripts/circle-flags

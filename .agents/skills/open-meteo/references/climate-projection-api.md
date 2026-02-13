# Climate Projection API

The Climate Projection API provides access to climate change projection data from 7 high-resolution CMIP6 models. It is designed for analyzing long-term climate trends from 1950 to 2050 with daily resolution.

## Endpoint

**Base URL:** `https://climate-api.open-meteo.com/v1/climate`

## Required Parameters

- **`latitude`** - Floating-point WGS84 coordinate (supports comma-separated values for multiple locations)
- **`longitude`** - Floating-point WGS84 coordinate (supports comma-separated values for multiple locations)
- **`start_date`** - ISO8601 format (yyyy-mm-dd). Available range: 1950-01-01 to 2050-12-31
- **`end_date`** - ISO8601 format (yyyy-mm-dd). Available range: 1950-01-01 to 2050-12-31
- **`models`** - Comma-separated list of climate models to query
- **`daily`** - Comma-separated list of daily climate variables to retrieve

## Optional Parameters

| Parameter | Default | Options | Description |
|-----------|---------|---------|-------------|
| `temperature_unit` | celsius | celsius, fahrenheit | Temperature unit |
| `wind_speed_unit` | kmh | kmh, ms, mph, kn | Wind speed unit |
| `precipitation_unit` | mm | mm, inch | Precipitation unit |
| `timeformat` | iso8601 | iso8601, unixtime | Time format |
| `disable_bias_correction` | false | true, false | Disable statistical downscaling |
| `cell_selection` | land | land, sea, nearest | Grid cell selection method |
| `apikey` | - | - | Required for commercial use |

## Available Climate Models (7 models)

| Model Name | Origin | Institution | Resolution | Special Notes |
|-----------|--------|-------------|------------|---------------|
| **CMCC_CM2_VHR4** | Italy | Fondazione Centro Euro-Mediterraneo (CMCC) | 30 km | ⚠️ Lacks snowfall/solar/cloud data |
| **FGOALS_f3_H** | China | Chinese Academy of Sciences (CAS) | 28 km | ⚠️ Limited humidity/wind aggregations |
| **HiRAM_SIT_HR** | Taiwan | Academia Sinica (AS-RCEC) | 25 km | ⚠️ Limited humidity/wind aggregations |
| **MRI_AGCM3_2_S** | Japan | Meteorological Research Institute (MRI) | 20 km | ✅ **Only model with full soil moisture coverage** |
| **EC_Earth3P_HR** | Europe | EC-Earth Consortium/SMHI | 29 km | ✅ **Full soil moisture available** |
| **MPI_ESM1_2_XR** | Germany | Max Planck Institute | 51 km | ⚠️ Limited humidity aggregations |
| **NICAM16_8S** | Japan | MIROC/JAMSTEC | 31 km | ✅ Comprehensive variables except soil moisture |

**Note:** Model names in API calls use underscores, not hyphens (e.g., `CMCC_CM2_VHR4`)

## Daily Weather Variables

### Temperature Variables
- `temperature_2m_max` - Maximum daily air temperature at 2m (°C/°F)
- `temperature_2m_min` - Minimum daily air temperature at 2m (°C/°F)
- `temperature_2m_mean` - Mean daily air temperature at 2m (°C/°F)

### Humidity Variables
- `relative_humidity_2m_max` - Maximum relative humidity (%)
- `relative_humidity_2m_min` - Minimum relative humidity (%)
- `relative_humidity_2m_mean` - Mean relative humidity (%)

**Note:** Some models only provide mean values for humidity.

### Wind Variables
- `wind_speed_10m_mean` - Mean daily wind speed at 10m (km/h, mph, m/s, kn)
- `wind_speed_10m_max` - Maximum daily wind speed at 10m (km/h, mph, m/s, kn)

### Precipitation Variables
- `precipitation_sum` - Total daily precipitation (rain + snow) (mm/inch)
- `rain_sum` - Liquid rain only (mm/inch)
- `snowfall_sum` - Snowfall amount in snow water equivalent (cm)

⚠️ **Snowfall Caveat:** May have larger biases in mountainous terrain as not adjusted for elevation differences.

### Radiation & Cloud Variables
- `shortwave_radiation_sum` - Daily sum of shortwave solar radiation (MJ/m²)
- `cloud_cover_mean` - Mean daily cloud cover (%)

### Soil Variables
- `soil_moisture_0_to_10cm_mean` - Mean soil moisture in top 10cm layer (m³/m³)

⚠️ **Limited Availability:** Only available for **MRI_AGCM3_2_S** and **EC_Earth3P_HR** models.

### Atmospheric Pressure
- `pressure_msl_mean` - Mean sea level pressure (hPa)

### Dewpoint Variables
- `mean_dewpoint_2m` - Mean dewpoint temperature (°C/°F)
- `minimum_dewpoint_2m` - Minimum dewpoint temperature (°C/°F)
- `maximum_dewpoint_2m` - Maximum dewpoint temperature (°C/°F)

### Evapotranspiration
- `reference_evapotranspiration_et0` - Reference evapotranspiration (mm/day)

## Example API Calls

### Single Location - Basic Temperature Request
```
https://climate-api.open-meteo.com/v1/climate?latitude=52.52&longitude=13.41&start_date=2040-01-01&end_date=2040-12-31&models=MRI_AGCM3_2_S&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min
```

### Multiple Models - Comprehensive Variables
```
https://climate-api.open-meteo.com/v1/climate?latitude=52.52&longitude=13.41&start_date=1950-01-01&end_date=2050-12-31&models=MRI_AGCM3_2_S,EC_Earth3P_HR&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_mean&temperature_unit=celsius&wind_speed_unit=kmh
```

### Multiple Locations (Berlin & Paris)
```
https://climate-api.open-meteo.com/v1/climate?latitude=52.52,48.85&longitude=13.41,2.35&start_date=2020-01-01&end_date=2050-12-31&models=CMCC_CM2_VHR4&daily=temperature_2m_mean,precipitation_sum
```

### Soil Moisture Query (MRI Model)
```
https://climate-api.open-meteo.com/v1/climate?latitude=40.71&longitude=-74.01&start_date=2030-01-01&end_date=2030-12-31&models=MRI_AGCM3_2_S&daily=soil_moisture_0_to_10cm_mean,precipitation_sum
```

## Response Format

```json
{
  "latitude": 52.52,
  "longitude": 13.419,
  "generationtime_ms": 2.2119,
  "utc_offset_seconds": 0,
  "timezone": "GMT",
  "timezone_abbreviation": "GMT",
  "elevation": 38.0,
  "daily_units": {
    "time": "iso8601",
    "temperature_2m_max": "°C",
    "temperature_2m_min": "°C"
  },
  "daily": {
    "time": ["2040-01-01", "2040-01-02", ...],
    "temperature_2m_max": [5.7, 6.7, ...],
    "temperature_2m_min": [2.0, 4.2, ...]
  }
}
```

## Important Notes & Limitations

### Data Quality & Purpose
- **Past/Recent Data:** Serves model validation purposes, not actual historical measurements
- **Future Projections:** Beyond 2050, projections highly dependent on emission scenarios (aligned with RCP8.5)

### Bias Correction
- **Default Behavior:** Linear bias correction applied monthly over 50-year time series
- **Climate Signal:** Climate change signal is preserved during correction
- **Disable Option:** Use `disable_bias_correction=true` to get raw model output

### Variable-Specific Limitations
- **Soil Moisture:** Only available in MRI_AGCM3_2_S and EC_Earth3P_HR models
- **Snowfall:** May have larger biases in complex mountainous terrain
- **Cloud Cover:** Regional/local scale uncertainties exist despite systematic bias correction
- **Wind Speed:** Terrain complexity significantly impacts simulation accuracy

### Elevation Adjustment
- Temperature variables are elevation-adjusted using a 90-meter digital elevation model

## Citation & Licensing

Models use CMIP6 data licensed under CC BY 4.0. Users must cite:
1. The CMIP6 program
2. Open-Meteo attribution

## Export Formats

The API supports multiple export formats:
- **JSON** (default)
- **CSV**
- **XLSX**

## Use Cases

- Long-term climate trend analysis (1950-2050)
- Climate change impact assessment
- Multi-model ensemble analysis
- Regional climate projection comparisons
- Agricultural planning and water resource management
- Climate scenario modeling

## Best Practices

1. **Model Selection:** Use multiple models for ensemble analysis rather than relying on a single model
2. **Variable Availability:** Check model capabilities before querying (e.g., soil moisture only in 2 models)
3. **Time Range:** Request only needed date ranges to reduce response size
4. **Bias Correction:** Keep default bias correction enabled unless you need raw model output
5. **Validation:** For historical periods, compare against actual observations for validation purposes

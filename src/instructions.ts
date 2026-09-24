import {
  AIR_QUALITY_TOOL,
  CLIMATE_PROJECTION_TOOL,
  DWD_ICON_FORECAST_TOOL,
  ECMWF_FORECAST_TOOL,
  ELEVATION_TOOL,
  ENSEMBLE_FORECAST_TOOL,
  FLOOD_FORECAST_TOOL,
  GEM_FORECAST_TOOL,
  GEOCODING_TOOL,
  GFS_FORECAST_TOOL,
  JMA_FORECAST_TOOL,
  MARINE_WEATHER_TOOL,
  METEOFRANCE_FORECAST_TOOL,
  METNO_FORECAST_TOOL,
  SEASONAL_FORECAST_TOOL,
  WEATHER_ARCHIVE_TOOL,
  WEATHER_FORECAST_TOOL,
} from './tools.js';
import { CHARACTER_LIMIT } from './truncation.js';

const MODEL_TOOLS = [
  DWD_ICON_FORECAST_TOOL,
  GFS_FORECAST_TOOL,
  METEOFRANCE_FORECAST_TOOL,
  ECMWF_FORECAST_TOOL,
  JMA_FORECAST_TOOL,
  METNO_FORECAST_TOOL,
  GEM_FORECAST_TOOL,
]
  .map((tool) => `\`${tool.name}\``)
  .join(', ');

// Sent once in the initialize result and placed in the client's system prompt.
// It carries the cross-tool guidance that no single tool description can: which
// of 17 overlapping tools answers which question, and request conventions shared
// by all of them. Tool names are interpolated from tools.ts so a rename cannot
// leave this text pointing at a tool that no longer exists.
//
// The date bounds and defaults below were checked against the live API; keep
// them in step with it.
export const SERVER_INSTRUCTIONS = `Open-Meteo weather data. Every data tool takes latitude/longitude: resolve place names with \`${GEOCODING_TOOL.name}\` first.

Choosing a tool:
- Forecast up to 16 days: \`${WEATHER_FORECAST_TOOL.name}\`, which picks the best model for the location. The model-specific tools (${MODEL_TOOLS}) are for when a particular model is asked for, or to compare models with one call per model.
- Recent past: \`past_days\` on a forecast tool (up to 92 days). Any date from 1940 to yesterday: \`${WEATHER_ARCHIVE_TOOL.name}\`.
- Forecast uncertainty: \`${ENSEMBLE_FORECAST_TOOL.name}\`. Weeks to ~7 months ahead: \`${SEASONAL_FORECAST_TOOL.name}\`. Climate-change scenarios, 1950 to 2050: \`${CLIMATE_PROJECTION_TOOL.name}\`.
- Pollution, pollen and UV: \`${AIR_QUALITY_TOOL.name}\`. Waves and sea temperature: \`${MARINE_WEATHER_TOOL.name}\`. River discharge: \`${FLOOD_FORECAST_TOOL.name}\`. Terrain height: \`${ELEVATION_TOOL.name}\`.

Requests and responses:
- Times are GMT unless \`timezone\` is set; \`timezone: "auto"\` uses the location's local time, which also makes daily values run from local midnight to midnight.
- Ask only for the variables and date range needed. Responses over ${CHARACTER_LIMIT.toLocaleString('en-US')} characters are cut short and marked \`truncated: true\`; narrow the request rather than drawing conclusions from partial data.
- \`null\` in a series means the model has no value for that time, not zero.`;

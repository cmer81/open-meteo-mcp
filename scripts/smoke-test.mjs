#!/usr/bin/env node
/**
 * End-to-end smoke test: launches the built server over stdio with a real MCP
 * client and calls every tool once against the live Open-Meteo API.
 *
 * This is deliberately NOT part of `npm test`: it needs network access and hits
 * a third-party API, so it is a manual pre-release check. What it catches that
 * the unit tests cannot:
 *
 *   - a tool publishing an empty input schema. `registerTool` derives the
 *     published JSON schema by introspecting the Zod object. Under Zod 3 a
 *     `.refine()` wrapped the object in a ZodEffects the SDK could not
 *     introspect, which is why `weather_archive` and `climate_projection` once
 *     published `{}`. Zod 4 attaches refinements to the object itself, so no
 *     unwrapping happens today; if an SDK or Zod upgrade changes that
 *     introspection again, schemas silently go empty and clients stop knowing
 *     what to send. Nothing in the unit tests would fail.
 *   - a tool that no longer reaches its upstream endpoint (moved, renamed, or
 *     rejecting a parameter combination we still send).
 *   - annotations going missing, which would cost read-only tools their
 *     auto-permission in Claude.
 *
 * Run it after any @modelcontextprotocol/sdk or zod upgrade, and before tagging
 * a release:
 *
 *   npm run build && npm run smoke
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const PARIS = { latitude: 48.85, longitude: 2.35 };

// One valid call per tool. Coordinates are chosen inside each model's domain —
// a regional model queried outside its area returns an error, not a forecast.
const CALLS = {
  weather_forecast: { ...PARIS, hourly: ['temperature_2m'] },
  weather_archive: {
    ...PARIS,
    start_date: '2024-01-01',
    end_date: '2024-01-03',
    hourly: ['temperature_2m'],
  },
  air_quality: { ...PARIS, hourly: ['pm10'] },
  marine_weather: { latitude: 54.5, longitude: 8.0, hourly: ['wave_height'] },
  elevation: { ...PARIS },
  flood_forecast: { ...PARIS, daily: ['river_discharge'] },
  seasonal_forecast: { ...PARIS, daily: ['temperature_2m_max'] },
  climate_projection: {
    ...PARIS,
    start_date: '2030-01-01',
    end_date: '2030-03-31',
    models: ['MRI_AGCM3_2_S'],
    daily: ['temperature_2m_max'],
  },
  ensemble_forecast: { ...PARIS, models: ['icon_seamless_eps'], hourly: ['temperature_2m'] },
  geocoding: { name: 'Paris' },
  dwd_icon_forecast: { ...PARIS, hourly: ['temperature_2m'] },
  gfs_forecast: { ...PARIS, hourly: ['temperature_2m'] },
  meteofrance_forecast: { ...PARIS, hourly: ['temperature_2m'] },
  ecmwf_forecast: { ...PARIS, hourly: ['temperature_2m'] },
  jma_forecast: { latitude: 35.68, longitude: 139.69, hourly: ['temperature_2m'] },
  metno_forecast: { latitude: 59.91, longitude: 10.75, hourly: ['temperature_2m'] },
  gem_forecast: { latitude: 45.5, longitude: -73.57, hourly: ['temperature_2m'] },
};

const transport = new StdioClientTransport({ command: 'node', args: ['dist/index.js'] });
const client = new Client({ name: 'smoke-test', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);

let failures = 0;

// Checked against the built server, so a packaging or SDK change that drops the
// initialize-time instructions shows up here.
const instructions = client.getInstructions();
if (!instructions) {
  console.log('FAIL server sent no instructions in the initialize result');
  failures++;
} else {
  console.log(`instructions -> ${instructions.length} chars`);
}

const { tools } = await client.listTools();
console.log(`listTools -> ${tools.length} tools`);

const emptySchema = tools.filter(
  (t) => !t.inputSchema?.properties || Object.keys(t.inputSchema.properties).length === 0,
);
if (emptySchema.length) {
  console.log(`FAIL empty published inputSchema: ${emptySchema.map((t) => t.name).join(', ')}`);
  failures++;
}

const missingAnnotations = tools.filter((t) => !t.annotations?.readOnlyHint || !t.title);
if (missingAnnotations.length) {
  console.log(
    `FAIL missing title/readOnlyHint: ${missingAnnotations.map((t) => t.name).join(', ')}`,
  );
  failures++;
}

// A tool added without a matching entry here would otherwise be silently skipped.
const uncovered = tools.map((t) => t.name).filter((name) => !(name in CALLS));
if (uncovered.length) {
  console.log(`FAIL no smoke-test call defined for: ${uncovered.join(', ')}`);
  failures++;
}

for (const [name, args] of Object.entries(CALLS)) {
  try {
    const result = await client.callTool({ name, arguments: args });
    const text = result.content?.[0]?.text ?? '';
    if (result.isError) {
      console.log(`FAIL ${name}: ${text.slice(0, 200)}`);
      failures++;
    } else {
      console.log(`ok   ${name}  (${text.length} chars)`);
    }
  } catch (error) {
    console.log(`FAIL ${name}: ${String(error.message).slice(0, 200)}`);
    failures++;
  }
}

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`);
await client.close();
process.exit(failures === 0 ? 0 : 1);

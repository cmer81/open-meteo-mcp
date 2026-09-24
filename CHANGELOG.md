# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases before 2.0.0 predate this file; see the
[GitHub releases](https://github.com/cmer81/open-meteo-mcp/releases) for their notes.

## [2.3.2] - 2026-09-25

### Changed

- **Tool responses are compact JSON** instead of 2-space indented. On real
  responses that is 33–56% fewer characters (a 7-day, 4-variable forecast:
  12,448 → 6,228), and about 2.4× more data now fits under the
  25,000-character truncation limit (an ICON ensemble keeps 4,200 of 6,720
  values instead of 1,720). The JSON content is unchanged.

## [2.3.1] - 2026-09-24

### Changed

- **Parameters whose meaning isn't obvious from their name are now described**
  in the published schemas: `timezone` on every tool (IANA name or `"auto"`
  for local time; the API defaults to GMT), `elevation` (values are adjusted
  to it), `current` / `current_weather`, `minutely_15`, `models` where
  omitting it picks a default, air-quality `domains`, flood `ensemble`,
  ensemble `temporal_resolution`, seasonal `weekly` / `monthly`, climate
  `disable_bias_correction`, and geocoding's `name`, `count`, `language` and
  `countryCode`. `tools/list` grows by ~4,400 characters.
- **Day counts and geocoding's `count` only accept integers.** `past_days`,
  `forecast_days` and `count` previously let fractional values through to the
  API.

## [2.3.0] - 2026-09-24

### Added

- **Server instructions.** The server now sends `instructions` at initialize,
  which MCP clients place in the model's system prompt. They say which of the
  17 tools answers which question (`weather_forecast` by default, the
  model-specific tools only for a named model or a comparison, `past_days` vs
  `weather_archive`, ensemble / seasonal / climate ranges), and the shared
  conventions: GMT unless `timezone` is set (`"auto"` for local time), keep
  requests narrow to avoid truncation, and `null` means no value, not zero.

## [2.2.1] - 2026-09-24

### Changed

- **Published tool schemas are ~35% smaller** (`tools/list` from ~155,600 to
  ~101,800 characters), which cuts the context every conversation spends on
  this server before its first message. Accepted inputs are unchanged.
  - The 133 forecast pressure-level variables (7 variables × 19 levels, e.g.
    `temperature_850hPa`) and the 114 ensemble ones are published as a single
    regex `pattern` instead of one enum member each. They were listed twice
    per forecast tool (`hourly` and `current`), across 8 tools.
  - Descriptions repeated across tools (`cell_selection`, `tilt`, `azimuth`,
    `start_hour`/`end_hour`, `past_*`/`forecast_*`) are shorter, with the same
    information.
- **An unknown `hourly`/`current` variable now gets an actionable error**
  explaining the `<variable>_<level>hPa` naming, instead of `Invalid input`.

## [2.2.0] - 2026-09-24

Model enums refreshed against the live API, and upstream responses are now
size-capped. Tool names are unchanged; the input changes are additive except
for geocoding's `format`, described below.

### Added

- **`ecmwf_forecast` accepts every model the `/v1/ecmwf` endpoint serves**:
  `ecmwf_ifs04`, `ecmwf_aifs025`, `ecmwf_aifs025_single`,
  `ecmwf_ifs_europe_ensemble_mean` and `ecmwf_aifs_europe_ensemble_mean`, in
  addition to `ecmwf_ifs`, `ecmwf_ifs025` and `best_match`. The tool
  description no longer claims AIFS returns 400. (#70)
- **New model IDs** for forecast, the provider-specific tools, ensemble and
  marine, among them the CHMI ALADIN models, the 15-minute HRRR / ICON-D2 /
  AROME variants, `jma_msm_upper_level`, the provider-prefixed ensemble names
  (`dwd_icon_*_eps`, `cmc_gem_geps`), `google_weathernext2_ensemble`, every
  `*_ensemble_mean` series, and the ECMWF WAM / NCEP GEFS-Wave marine models.
  (#71)

### Changed

- **Upstream responses are capped in size**: 10 MB for `weather_archive` and
  `climate_projection`, 5 MB for every other tool. Before this, a single
  archive query could download tens of MB and grow the process by 150 MB+,
  even though only 25 KB reached the model after truncation. A request over
  the cap now fails with `Response too large to process` and a hint to narrow
  it. (#67)
- **`geocoding`'s `format` only accepts `json`.** `protobuf` was offered but
  could never be returned as tool text. (#72)

### Fixed

- `express-rate-limit` is now declared as a direct dependency. It was imported
  by `src/security.ts` but resolved only through the MCP SDK's own
  dependencies. (#68)

## [2.1.0] - 2026-09-15

Major dependency upgrades. Tool names, parameters, schemas and responses are
unchanged; one error-reporting detail differs, described below.

### Changed

- **Cross-field validation errors now surface as MCP `-32602` instead of an
  `isError` tool result.** Tools with cross-field rules (`weather_archive` and
  `climate_projection`, both requiring `start_date <= end_date`) previously
  enforced them inside the handler and returned the failure as tool content.
  The SDK now validates against the full schema itself and rejects the call
  before dispatch. The message text is unchanged
  (`start_date must be before or equal to end_date`), but a client that
  branches on `isError` will see the difference.
- Upgraded to zod 4, express 5, TypeScript 7, vitest 5 and `@types/node` 22.
- The `ZodEffects` workaround in tool registration is gone. Under zod 3,
  `.refine()` wrapped the object in a `ZodEffects` the SDK could not
  introspect — it published an empty `{}` input schema while still validating
  strictly — so the schema had to be unwrapped via `.innerType()` before
  publication. Zod 4 attaches refinements to the object itself, so schemas
  publish correctly with no special handling.
- `moduleResolution` moved from the removed `node10` setting to `nodenext`,
  matching what this package already is: ESM with explicit `.js` extensions in
  relative imports.

### Added

- `npm run smoke` (`scripts/smoke-test.mjs`) starts the built server over stdio
  with a real MCP client and calls all 17 tools against the live API. It is the
  only check that catches a tool publishing an empty input schema — a silent
  failure where the server keeps validating strictly and every unit test keeps
  passing while clients lose the schema. Not part of `npm test`: it needs
  network access.
- The release workflow now runs `npm audit --audit-level high --omit=dev`
  before publishing. The audit previously ran only in CI on push and pull
  requests, so a tag could publish with known advisories.

## [2.0.2] - 2026-09-15

Maintenance release. No API or behaviour changes.

### Fixed

- **Geocoding validation errors are now in English.** Invalid input to
  `geocoding` was rejected with French text (`Le nom doit contenir au moins 2
  caractères`, `Le code pays doit être au format ISO-3166-1 alpha2`). These are
  not internal strings: Zod validation errors travel through the MCP error
  response to the client and the calling model, so a model correcting its own
  bad call got French while every other message in the server was English.

### Security

- **Updated dependencies to clear six transitive advisories**, two of them
  high-severity. `ip-address` 10.2.0 → 10.7.2 (SSRF and trust-boundary bypass,
  reached via `express-rate-limit`, which sits on the HTTP transport's request
  path next to the `TRUSTED_PROXIES` / `X-Forwarded-For` handling), `hono`
  4.12.32 → 4.13.8 (cache-key and proxy interpretation differential), and `qs`
  6.15.3 → 6.16.0 (array-limit bypass, denial of service via `isBuffer`).
  `npm audit` reports no vulnerabilities.

### Changed

- `@modelcontextprotocol/sdk` 1.26.0 → 1.30.0, `axios` 1.18.1 → 1.20.0,
  `dotenv` 17.3.1 → 17.4.2, `express` 4.22.2 → 4.22.3, plus development
  tooling. Declared version ranges were tightened to the versions actually
  tested, so `package.json` and the lockfile no longer disagree about the
  supported floor.

## [2.0.1] - 2026-07-26

Non-breaking schema documentation improvement.

### Changed

- **Ambiguous tool parameters now carry a description in the published JSON
  schema.** `cell_selection`, `tilt`, `azimuth`, `past_days`/`past_hours`,
  `forecast_days`/`forecast_hours`, and the date/hour string parameters
  previously exposed only their bare type/enum/min-max constraints, with
  nothing explaining what they mean (e.g. `tilt`/`azimuth` are for solar-panel
  irradiance calculations; `cell_selection` controls land/sea grid-cell
  preference near coastlines). They're now documented via shared, reusable Zod
  schemas applied across every endpoint that has them.
- Invalid `start_date`/`end_date`/`start_hour`/`end_hour` values now return a
  clear message (e.g. `Must be a date in YYYY-MM-DD format (e.g.
  "2024-03-15")`) instead of Zod's generic validation error.

## [2.0.0] - 2026-07-25

Security and correctness release. Everything breaking here is confined to the
**Streamable HTTP transport**. If you use the default stdio transport (npx,
Claude Desktop) or the Docker image, no action is required.

### Breaking Changes

- **The HTTP transport now binds to `127.0.0.1` instead of all interfaces.** A
  server started with `TRANSPORT=http` is reachable only from the local machine
  unless you set `HOST=0.0.0.0`. The failure mode is silent: the process starts
  normally and its internal health check still passes, but no external client can
  reach it. The Docker image sets `HOST=0.0.0.0` itself, so published ports keep
  working unchanged.

  ```bash
  # before
  TRANSPORT=http PORT=3000 npx open-meteo-mcp-server
  # after, for anything other than local-only use
  HOST=0.0.0.0 TRANSPORT=http PORT=3000 npx open-meteo-mcp-server
  ```

- **Requests carrying an `Origin` header are rejected with `403` unless the origin
  is allow-listed.** This is DNS rebinding protection. Clients that send no
  `Origin` — CLI tools, SDK transports, container probes — are unaffected. Browser
  based clients must now be declared:

  ```bash
  ALLOWED_ORIGINS=https://app.example,http://localhost:5173
  ```

- **`API_KEY` is now enforced on `GET` and `DELETE /mcp`, not just `POST`.** Any
  client that reached those two verbs without a key was relying on the flaw fixed
  below and will now receive `401`.

### Fixed

- **`weather_archive` and `climate_projection` published an empty input schema.**
  Both use a `.refine()` for their `start_date <= end_date` rule, which produces a
  `ZodEffects` the SDK cannot introspect: it advertised `{}` as the input schema
  while still validating strictly, so clients had no way to learn the parameters
  and any guess was rejected. Both tools now publish their full schema (16 and 13
  properties, with `latitude`, `longitude`, `start_date` and `end_date` required),
  and cross-field rules remain enforced.

- **Response truncation overshot its own limit by roughly 2.5x.** Sizes were
  measured on compact JSON while the response was emitted pretty-printed. A
  16-day, 20-variable forecast was "truncated" to 24,904 characters and emitted at
  61,279, which clients rejected outright. Truncation now measures the text as it
  is actually emitted, including the truncation notice, and the same request
  returns 24,959 characters.

- **Authentication and rate limiting never ran on `GET` and `DELETE /mcp`.** The
  middlewares were registered after those routes, and Express runs middleware in
  declaration order. With `API_KEY` set, `POST` answered `401` while `GET` and
  `DELETE` answered `404` having skipped authentication entirely; 70
  unauthenticated `DELETE`s drew no `429`. A caller holding a session id could
  terminate another client's session without a key. Session ids are UUIDv4 and
  cannot be guessed, so exploitation required a leaked id — but the key protected
  only one verb of three.

- **Clients sending `Accept: */*` received `406 Not Acceptable`.** The header
  normalizer mutated `req.headers`, but the SDK rebuilds the request from Node's
  raw header array through Hono, so its work was invisible to the transport. It
  now rewrites `rawHeaders` as well.

### Added

- `HOST` — interface the HTTP transport binds to (default `127.0.0.1`).
- `ALLOWED_ORIGINS` — comma-separated browser origins permitted to reach the
  server. Empty by default.
- 14 regression tests covering the published schema of every tool, the emitted
  response size, and the auth, origin and `Accept` behaviour of the HTTP pipeline.

### Documentation

- Documented `HOST`, `ALLOWED_ORIGINS` and the 25,000-character response cap,
  none of which were described anywhere despite appearing in every truncated
  payload.
- Corrected the README's production example, which the new binding default left
  unreachable, and its claim of 7-day forecasts (the schema allows 16).
- `CLAUDE.md` now records the three traps behind the fixes above, since none are
  apparent from reading the code: middleware mounted after a route silently skips
  it, truncation must measure the text as emitted, and `.refine()` yields a
  `ZodEffects` the SDK cannot introspect.

[2.3.2]: https://github.com/cmer81/open-meteo-mcp/compare/v2.3.1...v2.3.2
[2.3.1]: https://github.com/cmer81/open-meteo-mcp/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/cmer81/open-meteo-mcp/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/cmer81/open-meteo-mcp/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/cmer81/open-meteo-mcp/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/cmer81/open-meteo-mcp/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/cmer81/open-meteo-mcp/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/cmer81/open-meteo-mcp/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/cmer81/open-meteo-mcp/compare/v1.7.0...v2.0.0

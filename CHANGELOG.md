# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases before 2.0.0 predate this file; see the
[GitHub releases](https://github.com/cmer81/open-meteo-mcp/releases) for their notes.

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

[2.0.1]: https://github.com/cmer81/open-meteo-mcp/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/cmer81/open-meteo-mcp/compare/v1.7.0...v2.0.0

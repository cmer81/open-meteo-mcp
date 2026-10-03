---
paths:
  - "src/client.ts"
  - "src/client.test.ts"
---

# API client (`OpenMeteoClient`)

Separate Axios instances per Open-Meteo service (forecast, air quality, marine, archive, seasonal, ensemble, geocoding, flood, climate), each overridable by an `OPEN_METEO_*_API_URL` env var (full list in the README).

## Parameter building

`buildParams` serializes parameters:
- Arrays are joined with commas (`['temperature_2m', 'humidity']` → `"temperature_2m,humidity"`)
- Null/undefined values are filtered out
- All values are converted to strings

## Error handling

- Axios timeout is 30 seconds; each tool call also passes the MCP request's abort signal to axios, so a cancelled call or closed connection drops the upstream request
- Requests send a proper User-Agent header for API identification

## Response caching

`cachedGet()` wraps every endpoint call in an `lru-cache` keyed on the request. Four invariants are easy to break:

- **The key includes the request path.** Nine tools share the same axios instance (`this.client`) and differ only by path, and several accept identical parameters, so keying on parameters alone would serve GFS data for a JMA request.
- **Parameter names are sorted before the key is built.** `buildParams` preserves insertion order, so the same request arriving with keys in a different order would otherwise miss the cache.
- **The cache is bounded by bytes, not entry count** (`maxSize`, with the size passed explicitly on `set`). Responses can be several MB, so a count-bounded cache would reintroduce the memory exhaustion the axios limits prevent. Open-Meteo replies with `Transfer-Encoding: chunked` and no `Content-Length`, so the size is computed from the serialized payload. That figure counts JSON characters, while the cached value is the parsed object graph, which retains roughly 1.2-2.6x more: measured at 2.58x for a cache filled with typical 4 KB forecast responses, 2.16x for a 4 MB archive response and 1.23x for a 9 MB one. The ratio falls as payloads grow, since large responses are mostly packed numeric arrays while small ones pay fixed per-object overhead. A full cache at the 20 MB default (`OPEN_METEO_CACHE_MAX_BYTES`; `0` disables it, a blank or non-integer value falls back to the default) costs about 50 MB of heap; budget accordingly when changing it.
- **Cached values are handed out by reference.** Nothing may mutate a response in place, or it corrupts the entry for every later caller.

Failures are never cached — only a resolved response is stored, so a transient 429 or 5xx cannot be replayed for the lifetime of a TTL. TTLs are per endpoint in `CACHE_TTL_MS`, from 15 minutes for forecasts to 30 days for elevation.

# Forecast `models=` selection guide

Source: Official Open-Meteo provider documentation pages.

**Scope:** Weather Forecast API only. Does not cover Historical, Ensemble, Seasonal, Climate, Marine, Satellite Radiation, Elevation, or Flood APIs.

## How model selection works

- `models=auto` (default) — "Best match" combines optimal models automatically
- Explicit `models=<key>` — select specific provider/model
- Provider-specific endpoints — some providers have dedicated endpoints (e.g., `/v1/ecmwf`)

## Endpoints vs `models=`

**Generic Forecast endpoint (recommended):**
- URL: `https://api.open-meteo.com/v1/forecast`
- Use `models=auto` or `models=<provider_key>`
- Most flexible, supports switching providers per request

**Provider-specific endpoints:**
- `/v1/dwd-icon` — DWD ICON
- `/v1/gfs` — NOAA GFS/HRRR
- `/v1/ecmwf` — ECMWF IFS/AIFS
- `/v1/bom` — Australia BOM
- `/v1/cma` — China CMA

Start with the generic endpoint + `models=auto` unless you have specific requirements.

## Model selection rules

1. **Default to `models=auto`** — works globally, picks best available

2. **Use "seamless" models** when you want:
   - High-resolution short-range (2–3 days) + automatic extension with global models

3. **Use regional models** when you need:
   - Higher spatial resolution
   - Only care about short horizons (nowcast / 0–72h)

4. **Variable availability varies:**
   - Not all providers have direct solar radiation (some derive it)
   - Cloud cover at 2m (fog indicator) — only KMA, UKMO UKV, DMI
   - Probability data — only NBM (NOAA), ARPEGE (Météo-France)

5. **Licensing:**
   - UKMO: CC BY-SA 4.0 (derived products must stay compatible)

6. **Operational notes:**
   - BOM: temporary suspension due to platform upgrades
   - CMA: recent overload/reliability issues

## Provider quick reference

| Provider | Region | Resolution | Horizon | Seamless key |
|----------|--------|------------|---------|--------------|
| DWD ICON | Germany/Europe | 2–11 km | 2–7.5d | `icon_seamless` |
| NOAA GFS | Global/US | 3–13 km | 16d | `gfs_seamless` |
| Météo-France | France/Europe | 1.5–25 km | 2–4d | `meteofrance_seamless` |
| ECMWF | Global | 9–25 km | 15d | `ecmwf_ifs` |
| UKMO | UK/Global | 2–10 km | 2–7d | `ukmo_seamless` |
| KMA | Korea/Global | 1.5–12 km | 2–12d | `kma_seamless` |
| JMA | Japan/Global | 5–55 km | 4–11d | `jma_seamless` |
| MeteoSwiss | Central Europe | 1–2 km | 33h–5d | `meteoswiss_icon_ch1` |
| MET Norway | Nordic | 1 km | 2.5d | `metno_seamless` |
| GEM | Canada/Global | 2.5–15 km | 2–10d | `gem_seamless` |
| BOM | Australia | 15 km | 10d | `bom_access_global` |
| CMA | China/Global | 15 km | 10d | `cma_grapes_global` |
| KNMI | Netherlands | 2–5.5 km | 2.5–10d | `knmi_seamless` |
| DMI | Denmark | 2 km | 2.5–10d | `dmi_seamless` |
| ItaliaMeteo | Southern Europe | 2 km | 3d | `italia_meteo_arpae_icon_2i` |

## Finding specific model keys

If you need a specific sub-model (not seamless):
1. Go to the provider's docs page
2. Use "Preview → URL" generator
3. Copy `models=...` values from the generated URL

Provider docs:
- https://open-meteo.com/en/docs/dwd-api
- https://open-meteo.com/en/docs/gfs-api
- https://open-meteo.com/en/docs/ecmwf-api
- https://open-meteo.com/en/docs/meteofrance-api
- https://open-meteo.com/en/docs/ukmo-api
- https://open-meteo.com/en/docs/kma-api
- https://open-meteo.com/en/docs/jma-api
- https://open-meteo.com/en/docs/meteoswiss-api
- https://open-meteo.com/en/docs/metno-api
- https://open-meteo.com/en/docs/gem-api
- https://open-meteo.com/en/docs/bom-api
- https://open-meteo.com/en/docs/cma-api
- https://open-meteo.com/en/docs/knmi-api
- https://open-meteo.com/en/docs/dmi-api
- https://open-meteo.com/en/docs/italia-meteo-arpae-api

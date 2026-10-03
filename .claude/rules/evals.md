---
paths:
  - "evals/**"
---

# Evaluations

`evals/evaluation.xml` is an LLM-usability benchmark, not a unit test suite — it checks whether an LLM equipped with *only* this server's tools can answer real, complex questions using them.

Run it with `npm run eval` (requires `ANTHROPIC_API_KEY`, exported or in the gitignored `.env`, and `pip install -r evals/scripts/requirements.txt`). It calls the real Anthropic API, so it is a manual check, not part of CI. The harness puts the server's `instructions` in the system prompt like a real client; `npm run eval -- --no-server-instructions` gives a baseline without them.

Only `weather_archive`, `climate_projection`, `geocoding`, and `elevation` are exercised: the forecast/marine/flood/air-quality tools return live, "current" data with no historical equivalent, so their outputs would drift and can't produce a stable expected answer.

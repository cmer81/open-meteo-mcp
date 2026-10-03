---
name: release
description: Cut a new npm release of open-meteo-mcp-server (patch/minor/major) — pre-release verification, changelog, version tag and post-publish checks. Use when the user asks to release, publish, tag or bump the version.
disable-model-invocation: true
---

# Releasing

**Never run `npm publish` locally** — publishing is automated and a version number is burned permanently once used. `.github/workflows/release.yml` triggers on any `v*` tag and runs `npm ci` → `npm test` → `npm run build` → `npm audit` → `npm publish --provenance`, then creates the GitHub release.

## 1. Pre-release verification

`npm test` mocks the network, so it cannot tell whether the server still *works*. Both of these must be green before tagging:

```bash
npm run build && npm run smoke   # every tool, once, against the live API
npm audit --audit-level high --omit=dev
```

`npm run smoke` (`scripts/smoke-test.mjs`) starts the built server over stdio with a real MCP client and calls all 17 tools. It is the only check that catches a tool publishing an **empty input schema** (see `.claude/rules/tool-schemas.md`).

## 2. Prepare `main`

1. Land the changes on `main` (the tag is cut from whatever `main` points at).
2. Add the version's entry to `CHANGELOG.md` and commit it — `npm version` creates the release commit immediately after, so a changelog added later lands in the *next* release.

## 3. Tag

```bash
npm run release:patch   # 2.0.2 -> 2.0.3
npm run release:minor   # 2.0.2 -> 2.1.0
npm run release:major   # 2.0.2 -> 3.0.0
```

Each runs `npm version <level> && git push origin main --tags`, which triggers the workflow. Confirm with the user before running it.

## 4. After publishing

npm takes a few minutes to serve the new version. `npm view open-meteo-mcp-server version` returning the previous number right after a publish is propagation lag, not a failed release — confirm with the workflow log, which ends with `+ open-meteo-mcp-server@<version>`.

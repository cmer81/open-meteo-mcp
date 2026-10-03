# Contributing

Thanks for helping improve the Open-Meteo MCP server. Bug reports, fixes and new tools are all welcome. For anything larger than a fix, open an issue first so we can agree on the approach.

## Setup

You need Node.js 22 or later.

```bash
git clone https://github.com/cmer81/open-meteo-mcp.git
cd open-meteo-mcp
npm install
npm run build
```

## Before opening a pull request

CI runs these on Node 22, 24 and 25. Run them locally first:

```bash
npm run typecheck
npm run check        # Biome lint + format check; `npm run format` fixes formatting
npm test
npm run build
```

`npm test` mocks the network, so it can't tell whether the server still works against Open-Meteo. If your change touches a tool, a schema or a dependency, also run the end-to-end smoke test, which calls every tool once against the live API:

```bash
npm run build && npm run smoke
```

In the PR description, say what changes for users. You don't need to edit `CHANGELOG.md`: the entry is written at release time, and contributors are credited there.

## Adding or changing a tool

A tool touches several files, and some of them are checked by tests:

1. **`src/types.ts`**: the Zod input schema. Keep it `.strict()`, so unknown keys are rejected instead of being forwarded to the API.
2. **`src/tools.ts`**: name, title, description and annotations.
3. **`src/client.ts`**: the endpoint call, through `cachedGet()`.
4. **`src/index.ts`**: register it with `registerReadOnlyTool`.
5. **`src/instructions.ts`**: say when to use the tool. A test fails if a tool isn't mentioned.
6. **`scripts/smoke-test.mjs`**: add one valid call to `CALLS`. The smoke test fails if a tool has none.
7. **`evals/evaluation.xml`**: if the tool can be checked against stable data (historical, climate, geocoding, elevation), add a question that exercises it.

## Things that are easy to break

- **Responses**: always return them through `serializeToolResponse()` in `src/truncation.ts`, never `JSON.stringify`. It measures and truncates the text exactly as it is sent.
- **Cache**: cached responses are shared by reference. Never mutate a response object in place, or you corrupt the entry for every later caller.
- **stdio**: never write to stdout. It carries the MCP protocol stream; use `log()`, which writes to stderr.
- **HTTP middleware**: guards (origin check, rate limiting, auth) must be registered before the `/mcp` routes they protect.
- **SDK or Zod upgrades**: run `npm run smoke`. It is the only check that catches a tool publishing an empty input schema, which no unit test detects.

`CLAUDE.md` describes the architecture and these invariants in more detail.

## Releases

Releases are cut by the maintainer: a version tag triggers the workflow that publishes to npm and the GitHub Container Registry. Please don't bump the version in `package.json` in a PR.

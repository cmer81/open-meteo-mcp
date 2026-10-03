---
paths:
  - "src/types.ts"
  - "src/tools.ts"
  - "src/index.ts"
  - "src/instructions.ts"
  - "src/*schema*.test.ts"
  - "src/forecast-models.test.ts"
  - "scripts/smoke-test.mjs"
---

# Tool schemas and adding tools

## Checklist when adding, removing or renaming a tool

- Metadata (name, title, description, annotations) goes in `src/tools.ts`; the input schema in `src/types.ts`.
- Mention it in `src/instructions.ts` — a test fails otherwise.
- Add a call for it in `scripts/smoke-test.mjs` — the smoke test fails if a tool has none.
- Add or update a `qa_pair` in `evals/evaluation.xml` (also when materially changing a tool's description or schema).

## Schema validation

All param schemas are `.strict()`, so unknown keys are rejected rather than silently forwarded to the upstream API. Zod validates coordinate bounds (lat -90..90, lon -180..180), weather variable enums, `YYYY-MM-DD` dates, unit enums and forecast day limits (7-16 days for most services, up to 366 for flood).

The model-specific tools (`dwd_icon_forecast`, `gfs_forecast`, …) share the same parameter schema and differ only by endpoint path.

## Cross-field validation (`.refine()` / `.superRefine()`)

`registerTool` publishes the JSON schema by introspecting the Zod object. Under Zod 3 a refinement returned a **ZodEffects** the SDK could not introspect: it published an empty `{}` input schema while still validating strictly, leaving clients unable to know what to send. `registerReadOnlyTool` used to unwrap via `.innerType()` to work around it.

Zod 4 attaches refinements to the object itself, so a refined schema introspects correctly and that workaround is gone — `registerReadOnlyTool` passes the schema straight through. Consequently the SDK enforces cross-field rules itself and a violation surfaces as an MCP `-32602` error rather than an `isError` tool result; the message text (e.g. `start_date must be before or equal to end_date`) is unchanged.

This is a silent failure mode if it ever regresses: the server keeps validating strictly and every unit test keeps passing while clients lose the schema. `npm run smoke` asserts no tool publishes an empty schema — run it after any `@modelcontextprotocol/sdk` or `zod` upgrade.

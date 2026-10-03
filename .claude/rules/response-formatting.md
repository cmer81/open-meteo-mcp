---
paths:
  - "src/index.ts"
  - "src/truncation.ts"
  - "src/truncation.test.ts"
---

# Response formatting

All tool responses go through `serializeToolResponse()` (`src/truncation.ts`), which truncates if needed and JSON-stringifies compactly (no indentation). Always use it rather than calling `JSON.stringify` at the call site: truncation measures the text *as emitted*, and pretty-printing would change the character count (by 33-56% on real responses), so measuring one form while emitting another lets responses blow past the limit or waste it.

Responses over 25,000 characters have their `hourly`/`daily`/`minutely_15` arrays shrunk by an equal ratio (keeping parallel series aligned) or their `results` array trimmed, and gain `truncated: true` plus a `truncation_message`.

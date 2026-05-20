## 1. Schema and Validation

- [x] 1.1 Define presentation request and response types for selected context, user instructions, image references, debug source references, and supported slide variants.
- [x] 1.2 Implement runtime validation for the presentation response schema with a maximum of 10 slides.
- [x] 1.3 Implement input validation for empty selections, selected-item limits, text-size limits, and requested slide-count bounds.
- [x] 1.4 Implement detection of usable image sources from selected input and validation that generated image references resolve to selected sources.

## 2. LLM Prompt and Provider Orchestration

- [x] 2.1 Build structured source-block assembly that preserves selected item boundaries, titles, notes, body content, image metadata, and source identifiers.
- [x] 2.2 Build the LLM prompt/schema instructions for the four supported slide types and prohibit layout/rendering fields.
- [x] 2.3 Include optional user instructions for tone, language, audience, and slide count while enforcing the 10-slide maximum.
- [x] 2.4 Add provider invocation using server-only runtime configuration and return safe errors for provider failures or invalid JSON.

## 3. API Endpoint

- [x] 3.1 Add the authenticated Nuxt server endpoint for presentation structure generation.
- [x] 3.2 Wire request validation, prompt assembly, provider call, response parsing, schema validation, and debug metadata into the endpoint response.
- [x] 3.3 Ensure the endpoint does not persist artifacts, upload files, generate PowerPoint binaries, or expose provider credentials.

## 4. Tests

- [x] 4.1 Add tests for empty selection, oversized context, and invalid requested slide count without provider calls.
- [x] 4.2 Add tests for user instruction propagation and max-10 slide enforcement.
- [x] 4.3 Add tests for valid and invalid slide schemas, including rejection or stripping of layout fields according to the implemented validation contract.
- [x] 4.4 Add tests for image gating when selected content has no usable images and for rejecting invented image references.
- [x] 4.5 Add tests for mocked provider success, provider failure, invalid JSON, and safe error responses.

## 5. Documentation and Verification

- [x] 5.1 Document the endpoint request/response shape and the initial slide schema for future UI and PptxGenJS renderer work.
- [x] 5.2 Run the relevant web app checks and targeted tests for the new endpoint and validation utilities.

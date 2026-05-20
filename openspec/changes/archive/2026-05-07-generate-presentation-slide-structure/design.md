## Context

The existing podcast flow shows the desired shape: authenticated users select pinboard context, send optional instructions to a server endpoint, and receive generated content without exposing provider credentials to the browser. Presentation generation should reuse that pattern, but this stage stops at a structured JSON contract that a later PptxGenJS renderer can map to controlled templates.

The core constraint is separation of responsibilities. The LLM may choose slide order, slide type, titles, bullets, and source references. It MUST NOT choose coordinates, fonts, colors, dimensions, or PowerPoint-specific layout details.

## Goals / Non-Goals

**Goals:**

- Define a small JSON schema for generated presentation structures.
- Add a server-only LLM orchestration path that returns validated presentation JSON.
- Accept user instructions for tone, language, audience, and requested slide count.
- Enforce a maximum of 10 generated slides.
- Include debug-only source references so developers can trace generated slides back to selected pins/content.
- Gate image slide types on selected content that includes usable images.
- Keep the output directly consumable by future PptxGenJS layout functions.

**Non-Goals:**

- No PowerPoint binary generation.
- No PptxGenJS layout implementation.
- No presentation template styling.
- No artifact persistence or Storage upload.
- No new frontend three-step UI.
- No user-facing citations or source footnotes in the generated deck structure.

## Decisions

### Use a discriminated slide schema

The endpoint will validate a presentation object with a top-level title, optional subtitle, and an ordered `slides` array. Each slide uses a `type` discriminator:

- `cover`: title and optional subtitle.
- `bullets`: title plus bullet strings.
- `image-title`: title plus an image reference.
- `image-bullets`: title, image reference, and bullet strings.

Alternatives considered:

- A generic slide object with many optional fields. This is easier for the LLM but harder to validate and easier to misuse later.
- Rich layout metadata in the schema. This would leak renderer concerns into the LLM stage and make future template changes harder.

### Represent images as references, not generated assets

Image fields will point to selected content using a stable source identifier and optional alt/caption text. The LLM must not invent image URLs. If the request has no usable selected image sources, the prompt and validation path will disallow `image-title` and `image-bullets`.

Alternatives considered:

- Let the LLM choose external image URLs. This creates provenance, licensing, and availability problems.
- Allow image slides with empty placeholders. This makes later rendering ambiguous and weakens validation.

### Treat source references as debug metadata

Each generated slide may include source reference identifiers for debugging and traceability. These references are not intended for direct user display in this stage.

Alternatives considered:

- User-facing citations on every slide. Useful later, but it adds presentation design concerns before the renderer exists.
- No source references. Simpler, but harder to inspect prompt quality and hallucination risk during development.

### Validate before and after the LLM call

The endpoint will reject invalid input before calling the provider, including empty selections, oversized context, invalid requested slide counts, and image-slide requests without usable images. After the LLM returns, the endpoint will parse and validate JSON against the schema before returning it.

Alternatives considered:

- Trust provider structured output alone. Provider constraints help, but application validation still protects downstream rendering.
- Repair invalid LLM output silently. This can hide prompt/schema drift; explicit validation errors are easier to test and debug.

### Keep provider access server-side

The endpoint will use server runtime configuration for the LLM provider, consistent with existing podcast generation behavior. Browser code only calls the Nuxt server endpoint.

Alternatives considered:

- Direct client-side provider calls. This would expose credentials and make request validation harder to enforce.

## Risks / Trade-offs

- LLM output may omit useful selected content or over-compress nuance -> Mitigate with structured source blocks, clear prompt rules, and tests around prompt assembly.
- The initial slide type set may be too small for some content -> Mitigate by keeping the schema discriminated and extensible for future slide types.
- Debug source references could accidentally become user-facing -> Mitigate by naming/documenting them as debug metadata and excluding UI/rendering from this change.
- Image detection may miss usable media from some pin body variants -> Mitigate with conservative detection and tests for current known image pin shapes.
- Strict validation may reject otherwise understandable provider output -> Mitigate by making validation errors explicit and improving prompts rather than weakening the schema.

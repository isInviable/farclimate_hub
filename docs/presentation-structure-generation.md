# Presentation Structure Generation

`POST /api/presentation-structure` generates a validated presentation outline from selected pinboard/content items. It does not create a `.pptx`, upload artifacts, choose templates, or expose PptxGenJS layout details.

## Request

```json
{
  "items": [
    {
      "id": "pin-id",
      "title": "Source title",
      "bodyKind": "document",
      "sourceDocumentUid": "document-uid",
      "userNote": "Optional user note",
      "data": {
        "markdown": "Selected text or source content"
      }
    }
  ],
  "instructions": {
    "tone": "executive",
    "language": "Spanish",
    "audience": "city planners",
    "slideCount": 6,
    "extra": "Focus on implementation trade-offs."
  }
}
```

The endpoint also accepts `selectedItems` instead of `items`, a plain string `instructions`, `extraInstructions`, and `requestedSlideCount`. The maximum generated slide count is currently 10.

## Response

```json
{
  "presentation": {
    "title": "Article summary",
    "subtitle": "Optional subtitle",
    "slides": [
      {
        "type": "cover",
        "title": "How adaptation finance works",
        "subtitle": "From selected pinboard sources",
        "debugSourceIds": ["pin-id"]
      },
      {
        "type": "bullets",
        "title": "Key takeaways",
        "bullets": ["Funding must align with local implementation capacity"],
        "debugSourceIds": ["pin-id"]
      }
    ]
  },
  "sourceCount": 1,
  "generatedAt": "2026-05-07T00:00:00.000Z",
  "model": "gemini-3.1-flash-lite"
}
```

## Slide Types

- `cover`: `title`, optional `subtitle`, optional `debugSourceIds`.
- `bullets`: `title`, `bullets`, optional `debugSourceIds`.
- `image-title`: `title`, `image`, optional `debugSourceIds`.
- `image-bullets`: `title`, `image`, `bullets`, optional `debugSourceIds`.

Image references use selected input sources only:

```json
{
  "sourceId": "image-pin-id",
  "alt": "Optional alt text",
  "caption": "Optional caption"
}
```

The schema intentionally excludes coordinates, dimensions, fonts, colors, and PptxGenJS options. Future PowerPoint rendering should map these slide objects to controlled layout functions.

import { describe, expect, it } from "vitest";
import type { HumanPinRow } from "../../app/types/pins";
import {
  PODCAST_MAX_CONTEXT_CHARS,
  PODCAST_MAX_SELECTED_ITEMS,
  podcastSourceFromPin,
  selectedPodcastSources,
  totalPodcastWords,
  validatePodcastSelection,
} from "../../app/utils/podcastSelection";

function pin(overrides: Partial<HumanPinRow>): HumanPinRow {
  return {
    id: "pin-1",
    pinboard_id: "board-1",
    source_document_uid: "doc-1",
    source_title_snapshot: "Pinned source",
    body_kind: "selected_text",
    body: { v: 1, data: { quote: "Mangroves reduce wave energy." } },
    user_note: "Use this in the intro",
    sort_order: 0,
    created_at: "2026-04-30T00:00:00.000Z",
    updated_at: "2026-04-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("podcast selected source helpers", () => {
  it("builds one structured podcast source from a pin", () => {
    const result = podcastSourceFromPin(pin({}));

    expect(result.title).toBe("Pinned source");
    expect(result.wordCount).toBe(4);
    expect(result.source).toMatchObject({
      id: "pin-1",
      title: "Pinned source",
      bodyKind: "selected_text",
      sourceDocumentUid: "doc-1",
      userNote: "Use this in the intro",
      text: "Mangroves reduce wave energy.",
    });
  });

  it("keeps selected pin order and skips stale selected ids", () => {
    const pins = [
      pin({ id: "pin-a", body: { v: 1, data: { markdown: "A source" } } }),
      pin({ id: "pin-b", body: { v: 1, data: { markdown: "B source" } } }),
    ];

    const result = selectedPodcastSources(pins, ["pin-b", "missing", "pin-a"]);

    expect(result.map((item) => item.source.id)).toEqual(["pin-b", "pin-a"]);
  });

  it("uses resolved article full text for full-document pins", () => {
    const result = selectedPodcastSources(
      [
        pin({
          id: "pin-doc",
          body_kind: "document",
          source_document_uid: "doc-full",
          body: { v: 1, data: { pinned_as: "full_document" } },
        }),
      ],
      ["pin-doc"],
      { "doc-full": "Complete article text from the catalog." }
    );

    expect(result[0]?.source.text).toBe("Complete article text from the catalog.");
    expect(result[0]?.wordCount).toBe(6);
  });

  it("validates empty, oversized, and valid selections", () => {
    expect(validatePodcastSelection([])).toMatchObject({
      ok: false,
      code: "empty",
    });

    const tooMany = Array.from({ length: PODCAST_MAX_SELECTED_ITEMS + 1 }, (_, index) =>
      podcastSourceFromPin(pin({ id: `pin-${index}` }))
    );
    expect(validatePodcastSelection(tooMany)).toMatchObject({
      ok: false,
      code: "too_many_items",
    });

    const tooLong = [
      podcastSourceFromPin(
        pin({
          body: { v: 1, data: { markdown: "a".repeat(PODCAST_MAX_CONTEXT_CHARS + 1) } },
        })
      ),
    ];
    expect(validatePodcastSelection(tooLong)).toMatchObject({
      ok: false,
      code: "too_much_text",
    });

    const valid = [podcastSourceFromPin(pin({}))];
    expect(validatePodcastSelection(valid)).toEqual({ ok: true });
    expect(totalPodcastWords(valid)).toBe(4);
  });
});

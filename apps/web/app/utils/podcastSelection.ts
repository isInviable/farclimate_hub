import type { PodcastSelectedSource } from "~/types/podcastGeneration";
import type { HumanPinRow } from "~/types/pins";

export const PODCAST_MAX_SELECTED_ITEMS = 12;
export const PODCAST_MAX_CONTEXT_CHARS = 60_000;
export const PODCAST_MAX_TTS_INPUT_BYTES = 4_000;

export interface PodcastSourcePreview {
  source: PodcastSelectedSource;
  title: string;
  textLength: number;
  wordCount: number;
}

export interface PodcastSelectionValidation {
  ok: boolean;
  code?: "empty" | "too_many_items" | "empty_text" | "too_much_text";
  params?: Record<string, number>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function textFromMessages(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((message) => {
      const row = asRecord(message);
      return stringFrom(row.text) || stringFrom(row.content);
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function podcastTextFromPin(pin: HumanPinRow, documentText = ""): string {
  if (pin.body_kind === "document" && documentText.trim()) {
    return documentText.trim();
  }

  const data = asRecord(pin.body?.data);
  const candidates = [
    data.markdown,
    data.quote,
    data.fulltext,
    data.description,
    data.summary,
    data.text,
    data.content,
    textFromMessages(data.messages),
  ];
  return candidates.map(stringFrom).find(Boolean) ?? "";
}

export function podcastSourceFromPin(
  pin: HumanPinRow,
  documentText = ""
): PodcastSourcePreview {
  const data = asRecord(pin.body?.data);
  const text = podcastTextFromPin(pin, documentText);
  const title =
    pin.source_title_snapshot?.trim() ||
    stringFrom(data.title) ||
    stringFrom(data.label) ||
    "(no title)";

  return {
    title,
    textLength: text.length,
    wordCount: countWords(text),
    source: {
      id: pin.id,
      title,
      bodyKind: pin.body_kind,
      sourceDocumentUid: pin.source_document_uid,
      userNote: pin.user_note,
      text,
      data,
    },
  };
}

export function selectedPodcastSources(
  pins: HumanPinRow[],
  selectedIds: string[],
  documentTextByUid: Record<string, string> = {}
): PodcastSourcePreview[] {
  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  return selectedIds
    .map((id) => byId.get(id))
    .filter((pin): pin is HumanPinRow => Boolean(pin))
    .map((pin) =>
      podcastSourceFromPin(
        pin,
        pin.source_document_uid ? documentTextByUid[pin.source_document_uid] : ""
      )
    );
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function totalPodcastTextLength(sources: PodcastSourcePreview[]): number {
  return sources.reduce((sum, item) => sum + item.textLength, 0);
}

export function totalPodcastWords(sources: PodcastSourcePreview[]): number {
  return sources.reduce((sum, item) => sum + item.wordCount, 0);
}

export function validatePodcastSelection(
  sources: PodcastSourcePreview[]
): PodcastSelectionValidation {
  if (sources.length === 0) {
    return { ok: false, code: "empty" };
  }
  if (sources.length > PODCAST_MAX_SELECTED_ITEMS) {
    return {
      ok: false,
      code: "too_many_items",
      params: {
        max: PODCAST_MAX_SELECTED_ITEMS,
        current: sources.length,
      },
    };
  }

  const totalChars = totalPodcastTextLength(sources);
  if (totalChars === 0) {
    return { ok: false, code: "empty_text" };
  }
  if (totalChars > PODCAST_MAX_CONTEXT_CHARS) {
    return {
      ok: false,
      code: "too_much_text",
      params: {
        max: PODCAST_MAX_CONTEXT_CHARS,
        current: totalChars,
      },
    };
  }
  return { ok: true };
}

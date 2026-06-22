import type {
  PodcastArticleMetadata,
  PodcastSelectedSource,
} from "~/types/podcastGeneration";
import type { HumanPinRow } from "~/types/pins";
import {
  ARTIFACT_MAX_CONTEXT_CHARS,
  ARTIFACT_MAX_SELECTED_ITEMS,
  EXCLUDED_BODY_KINDS,
} from "~/utils/artifactSourceContext";

export const PODCAST_MAX_SELECTED_ITEMS = ARTIFACT_MAX_SELECTED_ITEMS;
export const PODCAST_MAX_CONTEXT_CHARS = ARTIFACT_MAX_CONTEXT_CHARS;
export const PODCAST_MAX_TTS_INPUT_BYTES = 4_000;

/** Resolved parent-article context fetched for a pin's source document. */
export interface ResolvedDocumentContext {
  fulltext: string;
  summary: string;
  subtitle: string;
  metadata: PodcastArticleMetadata;
}

/** Pin kinds that contribute no useful text to a podcast script. */
const PODCAST_EXCLUDED_BODY_KINDS = new Set([...EXCLUDED_BODY_KINDS, "image"]);

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

export function podcastTextFromPin(
  pin: HumanPinRow,
  context?: ResolvedDocumentContext
): string {
  if (pin.body_kind === "document" && context?.fulltext.trim()) {
    return context.fulltext.trim();
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
  context?: ResolvedDocumentContext
): PodcastSourcePreview {
  const data = asRecord(pin.body?.data);
  const text = podcastTextFromPin(pin, context);
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
      articleFullText: context?.fulltext ?? null,
      articleSummary: context?.summary ?? null,
      articleSubtitle: context?.subtitle ?? null,
      articleMetadata: context?.metadata ?? null,
    },
  };
}

export function selectedPodcastSources(
  pins: HumanPinRow[],
  selectedIds: string[],
  documentContextByUid: Record<string, ResolvedDocumentContext> = {}
): PodcastSourcePreview[] {
  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  return selectedIds
    .map((id) => byId.get(id))
    .filter((pin): pin is HumanPinRow => Boolean(pin))
    .filter((pin) => !PODCAST_EXCLUDED_BODY_KINDS.has(pin.body_kind))
    .map((pin) =>
      podcastSourceFromPin(
        pin,
        pin.source_document_uid ? documentContextByUid[pin.source_document_uid] : undefined
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

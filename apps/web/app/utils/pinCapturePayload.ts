import { emptyPinBody, type PinBodyV1 } from "../types/pins";
import type { PinCaptureRequest } from "../types/pinCapture";
import { isValidPinLocation } from "./pinBoardMap";

export interface BuiltPinCapturePayload {
  body_kind: string;
  body: PinBodyV1;
  source_document_uid: string | null;
  source_title_snapshot: string | null;
  user_note: string | null;
}

export function buildPinCapturePayload(
  input: PinCaptureRequest,
): BuiltPinCapturePayload {
  const data = { ...input.data };
  if (input.bodyKind === "document") {
    if (typeof data.pinned_as !== "string" || !data.pinned_as.trim()) {
      data.pinned_as = "full_document";
    }
  }
  if (isValidPinLocation(input.location)) {
    data.location = input.location;
  }

  return {
    body_kind: input.bodyKind,
    body: { ...emptyPinBody(), data },
    source_document_uid: input.sourceDocumentUid ?? null,
    source_title_snapshot: input.title ?? null,
    user_note: input.notes?.trim() || null,
  };
}

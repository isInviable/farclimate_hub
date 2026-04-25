export type PinCaptureBodyKind =
  | "text_segment"
  | "selected_text"
  | "recipe_section"
  | "ai_summary"
  | "grid_compare_summary"
  | "chat_response"
  | "contact"
  | "website"
  | "image"
  | (string & {});

export interface PinCaptureRequest {
  bodyKind: PinCaptureBodyKind;
  title?: string;
  data: Record<string, unknown>;
  notes?: string | null;
  sourceDocumentUid?: string | null;
  location?: [number, number] | null;
  animationElement?: HTMLElement | null;
}

export interface PinCaptureDraft {
  bodyKind: PinCaptureBodyKind;
  title: string;
  data: Record<string, unknown>;
  preview?: string;
}

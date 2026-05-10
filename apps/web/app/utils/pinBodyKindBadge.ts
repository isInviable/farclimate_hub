/**
 * Semantic colours for pin `body_kind` chips (`UBadge`), aligned with Nuxt UI tokens.
 */
export type PinBodyKindBadgeColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "neutral"

const KIND_COLORS: Record<string, PinBodyKindBadgeColor> = {
  selected_text: "primary",
  document: "secondary",
  ai_summary: "secondary",
  markmap: "success",
  chat: "info",
  chat_response: "info",
  website: "info",
  image: "warning",
  grid_compare_summary: "warning",
  recipe_section: "warning",
  text_segment: "neutral",
  section: "neutral",
  reference: "neutral",
  contact: "neutral",
  saved_search: "primary",
  unknown: "neutral",
}

export function pinBodyKindBadgeColor(
  bodyKind: string | undefined
): PinBodyKindBadgeColor {
  const k = (bodyKind || "unknown").toLowerCase()
  return KIND_COLORS[k] ?? "neutral"
}

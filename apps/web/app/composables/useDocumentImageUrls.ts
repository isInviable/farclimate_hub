/**
 * Collects image URLs for a knowledge document for the article summary gallery.
 * Runs the same logic on server and client (regex on fulltext); no DOMParser required.
 */
const IMG_SRC_RE = /<img[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi;

function decodeBasicHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Returns null for values that should not be shown as gallery URLs. */
export function normalizeImageUrlForList(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const s = decodeBasicHtmlEntities(raw.trim());
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:"))
    return null;
  if (lower.startsWith("data:") && !lower.startsWith("data:image/")) return null;
  return s;
}

export function extractImgSrcsFromHtml(html: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(IMG_SRC_RE.source, "gi");
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (src) out.push(src);
  }
  return out;
}

export function collectDocumentImageUrls(document: {
  image_url?: string | null;
  fulltext?: string | null;
}): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const push = (raw: string | null | undefined) => {
    const u = normalizeImageUrlForList(raw);
    if (!u) return;
    if (seen.has(u)) return;
    seen.add(u);
    ordered.push(u);
  };

  push(document.image_url);

  const ft = document.fulltext;
  if (typeof ft === "string" && ft.length > 0) {
    for (const src of extractImgSrcsFromHtml(ft)) {
      push(src);
    }
  }

  return ordered;
}

export function useDocumentImageUrls(
  document: MaybeRefOrGetter<{
    image_url?: string | null;
    fulltext?: string | null;
  } | null | undefined>,
) {
  return computed(() => {
    const doc = toValue(document);
    if (!doc) return [];
    return collectDocumentImageUrls(doc);
  });
}

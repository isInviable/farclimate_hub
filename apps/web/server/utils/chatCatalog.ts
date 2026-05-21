import type { ChatCatalogEntry, ChatCitation } from "../../app/types/chat";

export function filterCitationsToCatalog(
  citedArticleIds: string[],
  catalog: ChatCatalogEntry[],
): ChatCitation[] {
  if (!catalog.length || !citedArticleIds.length) return [];
  const byId = new Map(catalog.map((e) => [e.articleId, e]));
  const seen = new Set<string>();
  const out: ChatCitation[] = [];
  for (const raw of citedArticleIds) {
    const id = typeof raw === "string" ? raw.trim() : "";
    if (!id || seen.has(id)) continue;
    const entry = byId.get(id);
    if (!entry) continue;
    seen.add(id);
    out.push({
      articleId: entry.articleId,
      documentUid: entry.documentUid,
      title: entry.title,
    });
  }
  return out;
}

export function parseChatMode(value: unknown): "single" | "corpus" {
  return value === "corpus" ? "corpus" : "single";
}

export function normalizeCatalog(raw: unknown): ChatCatalogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatCatalogEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const articleId =
      typeof row.articleId === "string" ? row.articleId.trim() : "";
    const documentUid =
      typeof row.documentUid === "string"
        ? row.documentUid.trim()
        : articleId;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!articleId) continue;
    out.push({
      articleId,
      documentUid: documentUid || articleId,
      title: title || "—",
    });
  }
  return out;
}

export function getLastUserMessageText(messages: unknown[]): string {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") continue;
    const role = (msg as { role?: string }).role;
    if (role !== "user") continue;
    const parts = (msg as { parts?: unknown[] }).parts;
    if (Array.isArray(parts)) {
      const texts = parts
        .filter(
          (p): p is { type: string; text?: string } =>
            !!p &&
            typeof p === "object" &&
            (p as { type?: string }).type === "text" &&
            typeof (p as { text?: string }).text === "string",
        )
        .map((p) => p.text!.trim())
        .filter(Boolean);
      if (texts.length) return texts.join("\n");
    }
    const content = (msg as { content?: string }).content;
    if (typeof content === "string" && content.trim()) return content.trim();
  }
  return "";
}

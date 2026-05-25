import type { ChatCatalogEntry, ChatMode } from "~/types/chat";

type DocumentLike = Record<string, unknown>;

export type ChatSearchHitLike = {
  id?: string;
  document_uid?: string;
  document?: DocumentLike;
};

function resolveArticleId(doc: DocumentLike, fallbackId?: string): string {
  const uid =
    typeof doc.document_uid === "string" ? doc.document_uid.trim() : "";
  if (uid) return uid;
  const id = typeof doc.id === "string" ? doc.id.trim() : "";
  if (id) return id;
  return typeof fallbackId === "string" ? fallbackId.trim() : "";
}

function resolveTitle(doc: DocumentLike): string {
  const title = typeof doc.title === "string" ? doc.title.trim() : "";
  return title || "—";
}

export function buildDocumentContextBlob(
  doc: DocumentLike,
  articleId: string,
): string {
  return [
    "Success limitations: " + (doc.success_limitations ?? ""),
    " Solutions: " + (doc.solutions ?? ""),
    " Keywords: " + (doc.keywords ?? ""),
    "Stakeholders Participation: " + (doc.stakeholder_participation ?? ""),
    "Cost Benefict" + (doc.cost_benefit ?? ""),
    "lifetime" + (doc.lifetime ?? ""),
    "full text: " + (doc.fulltext ?? ""),
    "articleId: " + articleId,
  ].join("");
}

export function buildCatalogFromDocument(
  document: DocumentLike | null | undefined,
): ChatCatalogEntry[] {
  if (!document) return [];
  const articleId = resolveArticleId(document);
  if (!articleId) return [];
  return [
    {
      articleId,
      documentUid: articleId,
      title: resolveTitle(document),
    },
  ];
}

export function buildCatalogFromHits(
  hits: ChatSearchHitLike[] | null | undefined,
): ChatCatalogEntry[] {
  if (!hits?.length) return [];
  const seen = new Set<string>();
  const out: ChatCatalogEntry[] = [];
  for (const hit of hits) {
    const doc = hit.document ?? {};
    const articleId = resolveArticleId(
      doc,
      typeof hit.document_uid === "string"
        ? hit.document_uid
        : typeof hit.id === "string"
          ? hit.id
          : "",
    );
    if (!articleId || seen.has(articleId)) continue;
    seen.add(articleId);
    out.push({
      articleId,
      documentUid: articleId,
      title: resolveTitle(doc),
    });
  }
  return out;
}

export function buildDocumentBlobsFromCatalog(
  catalog: ChatCatalogEntry[],
  hits: ChatSearchHitLike[] | null | undefined,
  document: DocumentLike | null | undefined,
): string[] {
  if (document) {
    const entry = catalog[0];
    if (entry) return [buildDocumentContextBlob(document, entry.articleId)];
    return [];
  }
  if (!hits?.length || !catalog.length) return [];
  const byArticleId = new Map<string, DocumentLike>();
  for (const hit of hits) {
    const doc = hit.document ?? {};
    const articleId = resolveArticleId(
      doc,
      typeof hit.document_uid === "string"
        ? hit.document_uid
        : typeof hit.id === "string"
          ? hit.id
          : "",
    );
    if (articleId) byArticleId.set(articleId, doc);
  }
  return catalog.map((entry) => {
    const doc = byArticleId.get(entry.articleId) ?? {};
    return buildDocumentContextBlob(doc, entry.articleId);
  });
}

export function inferChatMode(
  document: DocumentLike | null | undefined,
  hits: ChatSearchHitLike[] | null | undefined,
): ChatMode {
  if (document) return "single";
  if (hits?.length) return "corpus";
  return "single";
}

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { sql } from "./config.js";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const IMAGES_ROOT = resolve(REPO_ROOT, "pipeline", "images");
const ARTICLE_IMAGES_BUCKET = "article-images";

// Kept in sync with the bucket allow-list in
// packages/supabase-setup/sql/08_article_images_storage.sql — do not add a
// MIME here without also widening the bucket's allowed_mime_types, or uploads
// will fail with "mime type ... is not supported".
const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function inferContentType(
  localPath: string,
  declared: string | null | undefined,
): string {
  const normalizedDeclared = declared?.split(";", 1)[0]?.trim().toLowerCase();
  if (normalizedDeclared && normalizedDeclared !== "application/octet-stream") {
    return normalizedDeclared;
  }
  const ext = extname(localPath).toLowerCase();
  return EXT_TO_MIME[ext] || "application/octet-stream";
}

// ---------------------------------------------------------------------------
// Manifest shape (must stay in sync with pipeline/download_images.py)
// ---------------------------------------------------------------------------

export interface ManifestEntry {
  position: number;
  source_url: string;
  local_path: string;
  storage_path_hint: string;
  title?: string | null;
  description?: string | null;
  credits?: string | null;
  content_type?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
}

export interface ImageManifest {
  slug: string;
  source_url?: string;
  page_file?: string;
  images: ManifestEntry[];
}

export interface UploadedImage {
  position: number;
  source_url: string;
  storage_path: string;
  public_url: string;
  title: string | null;
  description: string | null;
  credits: string | null;
  content_type: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
}

// ---------------------------------------------------------------------------
// Supabase storage client (lazy)
// ---------------------------------------------------------------------------

let _cachedStorageClient: SupabaseClient | null = null;
let _storageClientError: Error | null = null;

export function getStorageClient(): SupabaseClient | null {
  if (_cachedStorageClient) return _cachedStorageClient;
  if (_storageClientError) return null;

  const url = process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    _storageClientError = new Error(
      "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env — skipping image upload. " +
        "Set both to enable the article-images bucket upload step.",
    );
    console.warn(`  [images] ${_storageClientError.message}`);
    return null;
  }

  _cachedStorageClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _cachedStorageClient;
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

export function slugFromSourceUrl(sourceUrl: string | undefined): string | null {
  if (!sourceUrl) return null;
  try {
    const parsed = new URL(sourceUrl);
    const path = parsed.pathname.replace(/\/+$/, "");
    if (!path) return null;
    const last = path.split("/").pop();
    return last || null;
  } catch {
    return null;
  }
}

export function resolveArticleImagesDir(slug: string): string {
  return resolve(IMAGES_ROOT, slug);
}

// ---------------------------------------------------------------------------
// Manifest I/O
// ---------------------------------------------------------------------------

export function readImageManifest(slug: string): ImageManifest | null {
  const dir = resolveArticleImagesDir(slug);
  const manifestPath = resolve(dir, "manifest.json");
  if (!existsSync(manifestPath)) {
    console.warn(`  [images] Manifest missing for slug=${slug} (${manifestPath})`);
    return null;
  }
  try {
    const raw = readFileSync(manifestPath, "utf-8");
    const parsed = JSON.parse(raw) as ImageManifest;
    if (!parsed || !Array.isArray(parsed.images)) {
      console.warn(`  [images] Malformed manifest for slug=${slug} (no images[] array)`);
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn(`  [images] Failed to parse manifest for slug=${slug}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Upload + row replacement
// ---------------------------------------------------------------------------

function resolveLocalPath(slug: string, entry: ManifestEntry): string {
  // Prefer the absolute/repo-relative local_path when it exists; fall back to
  // reconstructing the path from the storage_path_hint filename.
  if (entry.local_path) {
    const absolute = resolve(REPO_ROOT, entry.local_path);
    if (existsSync(absolute)) return absolute;
  }
  const hintFilename = basename(entry.storage_path_hint || "");
  if (hintFilename) {
    const fallback = resolve(resolveArticleImagesDir(slug), hintFilename);
    if (existsSync(fallback)) return fallback;
  }
  return resolve(resolveArticleImagesDir(slug), entry.local_path || "");
}

export async function uploadArticleImages(
  slug: string,
  manifest: ImageManifest,
): Promise<UploadedImage[]> {
  const client = getStorageClient();
  if (!client) return [];

  const storage = client.storage.from(ARTICLE_IMAGES_BUCKET);
  const uploaded: UploadedImage[] = [];

  for (const entry of manifest.images) {
    const localPath = resolveLocalPath(slug, entry);
    if (!existsSync(localPath)) {
      console.warn(`  [images] Skipping position ${entry.position}: local file missing (${localPath})`);
      continue;
    }

    const storagePath = entry.storage_path_hint || `climateadapt/${slug}/${basename(localPath)}`;
    const contentType = inferContentType(localPath, entry.content_type);
    const bytes = readFileSync(localPath);

    const { error: uploadError } = await storage.upload(storagePath, bytes, {
      upsert: true,
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    });
    if (uploadError) {
      console.warn(
        `  [images] Upload failed for ${storagePath}: ${uploadError.message}`,
      );
      continue;
    }

    const { data: publicData } = storage.getPublicUrl(storagePath);
    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) {
      console.warn(`  [images] No public URL returned for ${storagePath}`);
      continue;
    }

    let byteCount: number | null = entry.bytes ?? null;
    if (byteCount == null) {
      try {
        byteCount = statSync(localPath).size;
      } catch {
        byteCount = null;
      }
    }

    uploaded.push({
      position: entry.position,
      source_url: entry.source_url,
      storage_path: storagePath,
      public_url: publicUrl,
      title: entry.title ?? null,
      description: entry.description ?? null,
      credits: entry.credits ?? null,
      content_type: contentType,
      width: entry.width ?? null,
      height: entry.height ?? null,
      bytes: byteCount,
    });
  }

  return uploaded;
}

export async function replaceDocumentImages(
  documentId: string,
  uploaded: UploadedImage[],
): Promise<void> {
  await sql`DELETE FROM knowledge.document_images WHERE document_id = ${documentId}`;
  if (uploaded.length === 0) return;

  // Stable ordering so the (document_id, position) UNIQUE constraint never bites.
  const sorted = [...uploaded].sort((a, b) => a.position - b.position);

  for (const row of sorted) {
    await sql`
      INSERT INTO knowledge.document_images (
        document_id, position, source_url, storage_path, public_url,
        title, description, credits, content_type, width, height, bytes
      ) VALUES (
        ${documentId},
        ${row.position},
        ${row.source_url},
        ${row.storage_path},
        ${row.public_url},
        ${row.title},
        ${row.description},
        ${row.credits},
        ${row.content_type},
        ${row.width},
        ${row.height},
        ${row.bytes}
      )
    `;
  }
}

export async function syncDocumentImagesForSlug(
  documentId: string,
  slug: string,
): Promise<number> {
  const manifest = readImageManifest(slug);
  if (!manifest) return 0;
  if (manifest.images.length === 0) {
    await replaceDocumentImages(documentId, []);
    return 0;
  }
  const uploaded = await uploadArticleImages(slug, manifest);
  await replaceDocumentImages(documentId, uploaded);
  return uploaded.length;
}

// ---------------------------------------------------------------------------
// Dev helpers (unused in production path; kept for ad-hoc debugging)
// ---------------------------------------------------------------------------

export function listKnownImageSlugs(): string[] {
  if (!existsSync(IMAGES_ROOT)) return [];
  return readdirSync(IMAGES_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

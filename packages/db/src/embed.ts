import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load pipeline/.env for GEMINI_API_KEY (root .env is loaded by config.ts)
config({ path: resolve(import.meta.dirname, "..", "..", "..", "pipeline", ".env") });

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = parseInt(
  process.env.GEMINI_EMBEDDING_DIMENSIONS ?? "768",
  10,
);

const MAX_FULLTEXT_CHARS = 6000;

const CACHE_PATH = resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "pipeline",
  "caches",
  "embeddings_cache.json",
);

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let cache: Record<string, number[]> = {};
let cacheLoaded = false;

function loadCache(): void {
  if (cacheLoaded) return;
  if (existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
    } catch {
      cache = {};
    }
  }
  cacheLoaded = true;
}

function saveCache(): void {
  const dir = resolve(CACHE_PATH, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

function cacheKey(text: string): string {
  const hash = createHash("sha256")
    .update(`${EMBEDDING_MODEL}:${EMBEDDING_DIMENSIONS}:${text}`)
    .digest("hex");
  return hash;
}

// ---------------------------------------------------------------------------
// Text composition
// ---------------------------------------------------------------------------

/**
 * Build the text to embed from title + summary + truncated fulltext.
 * Returns empty string if all inputs are empty/missing.
 */
export function composeEmbeddingText(
  title?: string | null,
  summary?: string | null,
  fulltext?: string | null,
): string {
  const parts: string[] = [];
  if (title?.trim()) parts.push(title.trim());
  if (summary?.trim()) parts.push(summary.trim());
  if (fulltext?.trim()) {
    const truncated = fulltext.trim().slice(0, MAX_FULLTEXT_CHARS);
    parts.push(truncated);
  }
  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

let genai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY in .env file.");
    process.exit(1);
  }
  if (!genai) {
    genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return genai;
}

/**
 * Compute an embedding vector for the given text.
 * Uses a local JSON cache to avoid redundant API calls.
 * Returns { embedding, cached } where cached indicates whether it was a cache hit.
 */
export async function computeEmbedding(
  text: string,
): Promise<{ embedding: number[]; cached: boolean }> {
  loadCache();

  const key = cacheKey(text);
  if (cache[key]) {
    return { embedding: cache[key], cached: true };
  }

  const client = getClient();
  const response = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType: "RETRIEVAL_DOCUMENT",
    },
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error("Gemini returned no embedding values");
  }

  cache[key] = embedding;
  saveCache();

  return { embedding, cached: false };
}

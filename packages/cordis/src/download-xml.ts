import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  DEFAULT_DOWNLOADS_DIR,
  DEFAULT_SOURCES_PATH,
  getArgValue,
  hasFlag,
} from "./paths.js";

// Skips projects already on disk by default, so a source list that grew from 46
// to 65 entries only fetches the 19 new ones. Pass --refresh to re-fetch
// everything when CORDIS has updated the records themselves.

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 500;

function extractProjectId(url: string): string | null {
  const match = url.match(/project\/id\/(\d+)/);
  return match?.[1] ?? null;
}

function looksLikeXml(body: string): boolean {
  const trimmed = body.trimStart();
  return trimmed.startsWith("<?xml") || trimmed.startsWith("<project");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await stat(path);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

/** Fetches one project, retrying transient failures with exponential backoff. */
async function fetchXml(url: string): Promise<string> {
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await sleep(BASE_DELAY_MS * 2 ** (attempt - 2));

    try {
      const response = await fetch(url);

      // 4xx other than rate limiting will not fix themselves.
      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        const retriable = response.status === 429 || response.status >= 500;
        if (!retriable) break;
        continue;
      }

      const body = await response.text();
      if (!looksLikeXml(body) || body.trim().length === 0) {
        lastError = "response was not XML";
        continue;
      }
      return body;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(`${lastError} after ${MAX_ATTEMPTS} attempt(s)`);
}

async function main() {
  const sourcesPath = getArgValue("--sources") ?? DEFAULT_SOURCES_PATH;
  const downloadsDir = getArgValue("--downloadsDir") ?? DEFAULT_DOWNLOADS_DIR;
  const refresh = hasFlag("--refresh");
  await mkdir(downloadsDir, { recursive: true });

  const raw = await readFile(sourcesPath, "utf8");
  const urls = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.toLowerCase().startsWith("url"));

  if (urls.length === 0) {
    console.error(`No source URLs found in ${sourcesPath}`);
    process.exit(1);
  }

  const failures: string[] = [];
  const seen = new Set<string>();
  let downloaded = 0;
  let skipped = 0;

  for (const url of urls) {
    const projectId = extractProjectId(url);
    if (!projectId) {
      failures.push(`unrecognized URL: ${url}`);
      continue;
    }
    if (seen.has(projectId)) continue;
    seen.add(projectId);

    const target = resolve(downloadsDir, `${projectId}.xml`);
    if (!refresh && (await fileExists(target))) {
      skipped++;
      continue;
    }

    console.log(`Downloading project ${projectId}...`);
    try {
      await writeFile(target, await fetchXml(url), "utf8");
      downloaded++;
    } catch (error) {
      failures.push(`${projectId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log(
    `${downloaded} downloaded, ${skipped} already present${refresh ? " (--refresh: none skipped)" : ""}, ` +
      `${seen.size} project(s) in ${sourcesPath}. Files in ${downloadsDir}`,
  );

  if (failures.length > 0) {
    console.error(`\nDownload failed for ${failures.length} source(s):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

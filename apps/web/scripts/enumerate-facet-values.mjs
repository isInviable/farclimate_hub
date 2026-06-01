#!/usr/bin/env node
/**
 * Enumerate unique canonical facet values from live corpus metadata or local fallbacks.
 * Run: node scripts/enumerate-facet-values.mjs [--out path.json] [--base-url http://localhost:3000]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

const CATEGORIES = [
  "climate_impacts",
  "adaptation_approaches",
  "sectors",
  "biogeographical_regions",
  "keywords",
];

function fromLocalFiles() {
  const analysisPath = join(webRoot, "public/analysis_results.json");
  const samplePath = join(webRoot, "public/sampledata/combined_data.json");
  const analysis = JSON.parse(readFileSync(analysisPath, "utf8"));
  const sampleDocs = JSON.parse(readFileSync(samplePath, "utf8"));

  function fromAnalysis(name) {
    return (analysis[name] ?? [])
      .map((entry) => entry.name?.trim())
      .filter(Boolean);
  }

  const inventory = {
    climate_impacts: [...new Set(fromAnalysis("climate_impacts"))].sort(),
    adaptation_approaches: [...new Set(fromAnalysis("adaptation_approaches"))].sort(),
    keywords: [...new Set(fromAnalysis("keywords"))].sort(),
    sectors: new Set(),
    biogeographical_regions: new Set(["no-identificados"]),
  };

  for (const doc of sampleDocs) {
    if (doc.sectors) {
      const parts =
        typeof doc.sectors === "string" ? doc.sectors.split(",") : doc.sectors;
      for (const part of parts) {
        const trimmed = String(part).trim();
        if (trimmed) inventory.sectors.add(trimmed);
      }
    }
    const raw = doc.geographic_characterisation?.biogeographical_regions;
    if (raw) {
      for (const part of String(raw).split(",")) {
        const trimmed = part.trim();
        if (trimmed) inventory.biogeographical_regions.add(trimmed);
      }
    }
  }

  inventory.sectors = [...inventory.sectors].sort();
  inventory.biogeographical_regions = [...inventory.biogeographical_regions].sort();
  return inventory;
}

async function fromCorpusMetadata(baseUrl) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/explorer/corpus-metadata`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status}`);
  }
  const data = await res.json();
  const inventory = {};
  for (const cat of CATEGORIES) {
    const values = (data.globalFacets?.[cat] ?? [])
      .map((entry) => entry.value?.trim())
      .filter(Boolean);
    inventory[cat] = [...new Set(values)].sort();
  }
  return inventory;
}

const baseUrlArg = process.argv.indexOf("--base-url");
const baseUrl =
  baseUrlArg >= 0
    ? process.argv[baseUrlArg + 1]
    : process.env.NUXT_TEST_BASE_URL || "http://localhost:3000";

let inventory;
try {
  inventory = await fromCorpusMetadata(baseUrl);
  console.log(`Loaded facet inventory from ${baseUrl}/api/explorer/corpus-metadata`);
} catch (error) {
  console.warn(`Corpus metadata unavailable (${error.message}); using local files`);
  inventory = fromLocalFiles();
}

const outArg = process.argv.indexOf("--out");
const outPath =
  outArg >= 0
    ? process.argv[outArg + 1]
    : join(webRoot, "scripts/facet-value-inventory.json");

writeFileSync(outPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

for (const cat of CATEGORIES) {
  console.log(`${cat}: ${inventory[cat].length} values`);
}
console.log(`Wrote ${outPath}`);

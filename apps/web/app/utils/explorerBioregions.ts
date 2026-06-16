import type { ArticleDetail, SearchResult } from '@/types/search'

const NO_REGION = 'no-identificados'

/** Bioregion multi-hot dominates geography in UMAP distance (continents > map coords). */
export const BIO_WEIGHT = 2.5
export const GEO_WEIGHT = 1.0
export const JITTER_WEIGHT = 0.5

/** Fixed palette for EU biogeographical regions (continent metaphor). */
export const BIOREGION_COLORS: Record<string, string> = {
  Alpine: '#1e63a2',
  Arctic: '#5b9bd5',
  Atlantic: '#154a7a',
  Boreal: '#9e9e14',
  Continental: '#dabd03',
  Mediterranean: '#c45c26',
  Pannonian: '#6b4c9a',
  [NO_REGION]: '#9ca3af',
}

export function bioregionColor(region: string): string {
  return BIOREGION_COLORS[region] ?? '#1e63a2'
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m?.[1] || !m[2] || !m[3]) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

export function bioregionFill(region: string, alpha: number): string {
  const rgb = hexToRgb(bioregionColor(region))
  if (!rgb) return `rgba(30, 99, 162, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

export function isUnidentifiedRegion(region: string): boolean {
  return region === NO_REGION
}

/** Hit spans two or more bioregions (bridge between continents). */
export function isBioregionBridge(regions: string[]): boolean {
  return regions.length >= 2
}

/** Primary region for dot color: first named region, else fallback. */
export function primaryBioregion(regions: string[]): string {
  const named = regions.filter((r) => r !== NO_REGION).sort((a, b) => a.localeCompare(b))
  if (named.length > 0) return named[0]!
  return regions[0] ?? NO_REGION
}

/** Normalize raw `biogeographical_regions` field (string or array); empty list if unusable. */
export function normalizeBiogeographicalRegionsRaw(value: unknown): string[] {
  if (value === null || value === undefined) return []

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    const split = trimmed.split(',').map((item) => item.trim()).filter(Boolean)
    return split.length ? [...new Set(split)] : []
  }

  if (Array.isArray(value)) {
    const flattened = value
      .flatMap((item) => {
        if (item === null || item === undefined) return []
        if (typeof item === 'string') {
          return item.split(',').map((part) => part.trim()).filter(Boolean)
        }
        const s = String(item).trim()
        return s ? [s] : []
      })
      .filter(Boolean)
    return flattened.length ? [...new Set(flattened)] : []
  }

  return []
}

/** Regions for a search hit; mirrors facet semantics (missing → `no-identificados`). */
export function biogeographicalRegionsForHit(hit: {
  document?: SearchResult | ArticleDetail | null
}): string[] {
  const geo = hit.document?.geographic_characterisation
  if (!geo || typeof geo !== 'object' || Array.isArray(geo)) {
    return [NO_REGION]
  }
  const list = normalizeBiogeographicalRegionsRaw(
    (geo as Record<string, unknown>).biogeographical_regions
  )
  return list.length ? [...new Set(list)] : [NO_REGION]
}

/** Matches explorer filtered hits: `document.id` may be omitted at type level. */
export type SearchHitLike = { id: string; document?: SearchResult | null }

export type RegionUmapModel = {
  regionNames: string[]
  /** Symmetric co-occurrence: diagonal = doc count with region; off-diag = docs with both. */
  matrix: number[][]
  /** Hit count per region (same as diagonal of matrix). */
  counts: Record<string, number>
  /** First hit in `hits` order that contains each region (for panel open). */
  representativeByRegion: Map<string, SearchResult>
}

/**
 * Build per-region counts and symmetric co-occurrence from filtered hits.
 * For each document, increments diagonal for each region it has; for each unordered pair, increments both off-diagonals.
 */
export function buildRegionCooccurrenceFromHits(hits: SearchHitLike[]): RegionUmapModel {
  const perDocRegions = hits.map((h) => biogeographicalRegionsForHit(h))
  const allRegions = new Set<string>()
  for (const rs of perDocRegions) {
    for (const r of rs) allRegions.add(r)
  }
  const regionNames = [...allRegions].sort((a, b) => a.localeCompare(b))
  const n = regionNames.length
  const idx = new Map(regionNames.map((r, i) => [r, i] as const))

  const matrix = Array.from({ length: n }, () => Array(n).fill(0))
  const representativeByRegion = new Map<string, SearchResult>()

  for (let hi = 0; hi < hits.length; hi++) {
    const hit = hits[hi]!
    const doc = hit.document
    const unique = [...new Set(perDocRegions[hi]!)]
    for (let a = 0; a < unique.length; a++) {
      const labelA = unique[a]!
      const ia = idx.get(labelA)
      if (ia === undefined) continue
      if (doc?.id && !representativeByRegion.has(labelA)) {
        representativeByRegion.set(labelA, doc)
      }
      for (let b = a; b < unique.length; b++) {
        const labelB = unique[b]!
        const ib = idx.get(labelB)
        if (ib === undefined) continue
        matrix[ia]![ib]! += 1
        if (ia !== ib) matrix[ib]![ia]! += 1
      }
    }
  }

  const counts: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    const name = regionNames[i]!
    counts[name] = matrix[i]![i]!
  }

  return { regionNames, matrix, counts, representativeByRegion }
}

/** Deterministic scalar in [0, 1) from id + salt (tie-break after bioregion + geo features). */
export function umapJitter01(id: string, salt: number): number {
  let h = (salt + 1) * 374761393
  for (let j = 0; j < id.length; j++) {
    h = (h * 31 + id.charCodeAt(j)) >>> 0
  }
  return (h % 10000) / 10000
}

/**
 * Valid `[lat, lon]` in degrees from `document.location` (same order as map view: index 0 = lat, 1 = lon).
 * Returns null for missing data, non-finite values, or `[0, 0]` placeholder (no usable point).
 */
export function parseDocumentLatLon(location: unknown): { lat: number; lon: number } | null {
  if (!Array.isArray(location) || location.length !== 2) return null
  const lat = Number(location[0])
  const lon = Number(location[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (lat === 0 && lon === 0) return null
  return { lat, lon }
}

function minMax01(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0.5
  if (max === min || !Number.isFinite(min) || !Number.isFinite(max)) return 0.5
  return (value - min) / (max - min)
}

/**
 * One row per hit: multi-hot over sorted `regionNames`, then min–max scaled lat/lon over this batch,
 * then one id jitter dimension for exact ties. Invalid/missing coords use the batch centroid (0.5, 0.5) in normalized space.
 */
export function buildPerHitUmapVectors(hits: SearchHitLike[]): {
  regionNames: string[]
  perHitRegions: string[][]
  vectors: number[][]
} {
  const perHitRegions = hits.map((h) => biogeographicalRegionsForHit(h))
  const all = new Set<string>()
  for (const rs of perHitRegions) {
    for (const r of rs) all.add(r)
  }
  const regionNames = [...all].sort((a, b) => a.localeCompare(b))
  const k = regionNames.length
  const idx = new Map(regionNames.map((r, i) => [r, i] as const))

  const parsed = hits.map((h) => parseDocumentLatLon(h.document?.location))
  const valid = parsed.filter((p): p is { lat: number; lon: number } => p !== null)
  let minLat = 0
  let maxLat = 1
  let minLon = 0
  let maxLon = 1
  if (valid.length > 0) {
    minLat = Math.min(...valid.map((p) => p.lat))
    maxLat = Math.max(...valid.map((p) => p.lat))
    minLon = Math.min(...valid.map((p) => p.lon))
    maxLon = Math.max(...valid.map((p) => p.lon))
  }

  const GEO_LAT = k
  const GEO_LON = k + 1
  const JITTER = k + 2

  const vectors = hits.map((hit, hi) => {
    const row = new Array(k + 3).fill(0)
    for (const r of perHitRegions[hi]!) {
      const i = idx.get(r)
      if (i !== undefined) row[i] = BIO_WEIGHT
    }
    const p = parsed[hi]
    if (p) {
      row[GEO_LAT] = minMax01(p.lat, minLat, maxLat) * GEO_WEIGHT
      row[GEO_LON] = minMax01(p.lon, minLon, maxLon) * GEO_WEIGHT
    } else {
      row[GEO_LAT] = 0.5 * GEO_WEIGHT
      row[GEO_LON] = 0.5 * GEO_WEIGHT
    }
    row[JITTER] = umapJitter01(hit.id, 0) * JITTER_WEIGHT
    return row
  })

  return { regionNames, perHitRegions, vectors }
}

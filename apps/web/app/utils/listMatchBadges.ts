import type { SearchResult } from '@/types/search'
import { normalizeBiogeographicalRegionsRaw } from '@/utils/explorerBioregions'
import { activeKeysFromBooleanMap } from '@/utils/explorerFacetFilters'

export type ListMatchBadgeKind = 'sector' | 'hazard' | 'bioregion' | 'adaptation'

export interface ListMatchBadge {
  kind: ListMatchBadgeKind
  label: string
  color?: 'neutral' | 'warning' | 'primary' | 'success'
}

function docSectorsList(doc: SearchResult): string[] {
  const s = doc.sectors
  if (!s) return []
  return Array.isArray(s) ? s : [s]
}

/**
 * Badges for list rows: active filter keys (sector, hazards, biogeographical_regions) that intersect this document.
 * Annotates rows with active filter labels; does not remove hits from the result list.
 */
export function listMatchBadgesForDocument(
  doc: SearchResult,
  snapshot: Record<string, unknown>
): ListMatchBadge[] {
  const out: ListMatchBadge[] = []

  const sectorFilter = snapshot.sector
  const activeSectors = activeKeysFromBooleanMap(sectorFilter)
  if (activeSectors.length) {
    const docSectors = docSectorsList(doc)
    for (const key of activeSectors) {
      if (
        docSectors.some((s: string) =>
          s.toLowerCase().includes(key.toLowerCase())
        )
      ) {
        out.push({ kind: 'sector', label: key, color: 'neutral' })
      }
    }
  }

  const hazardsFilter = snapshot.hazards
  const activeHazards = activeKeysFromBooleanMap(hazardsFilter)
  if (activeHazards.length) {
    const docHazards = doc.climate_impacts || []
    for (const key of activeHazards) {
      if (
        docHazards.some((h: string) =>
          h.toLowerCase().includes(key.toLowerCase())
        )
      ) {
        out.push({ kind: 'hazard', label: key, color: 'warning' })
      }
    }
  }

  const approachesFilter = snapshot.adaptation_approaches
  const activeApproaches = activeKeysFromBooleanMap(approachesFilter)
  if (activeApproaches.length) {
    const docApproaches = doc.adaptation_approaches || []
    for (const key of activeApproaches) {
      if (
        docApproaches.some((a: string) =>
          a.toLowerCase().includes(key.toLowerCase())
        )
      ) {
        out.push({ kind: 'adaptation', label: key, color: 'success' })
      }
    }
  }

  const br = snapshot.biogeographical_regions
  const activeRegions = Array.isArray(br)
    ? br.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : activeKeysFromBooleanMap(br)

  if (activeRegions.length) {
    const raw = doc.geographic_characterisation?.biogeographical_regions
    const docRegions = normalizeBiogeographicalRegionsRaw(raw)
    for (const key of activeRegions) {
      const kl = key.toLowerCase()
      if (
        docRegions.some(
          (r) =>
            r.toLowerCase().includes(kl) || kl.includes(r.toLowerCase())
        )
      ) {
        out.push({ kind: 'bioregion', label: key, color: 'primary' })
      }
    }
  }

  return out
}

const MAX_VISIBLE = 6

export function visibleListMatchBadges(
  badges: ListMatchBadge[],
  maxVisible = MAX_VISIBLE
): { visible: ListMatchBadge[]; overflow: number } {
  if (badges.length <= maxVisible) {
    return { visible: badges, overflow: 0 }
  }
  return {
    visible: badges.slice(0, maxVisible),
    overflow: badges.length - maxVisible,
  }
}

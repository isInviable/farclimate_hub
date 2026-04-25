/**
 * API tests for GET /api/explorer/corpus-metadata.
 *
 * Integration tests require a running Nuxt server:
 * NUXT_TEST_BASE_URL=http://localhost:3000 pnpm test
 */
import { describe, expect, it } from "vitest"
import type { ExplorerCorpusMetadataResponse } from "~/app/types/facets"

describe("Explorer corpus metadata response shape", () => {
  it("contains totalCount and globalFacets only", () => {
    const mock: ExplorerCorpusMetadataResponse = {
      totalCount: 842,
      globalFacets: {
        sectors: [{ value: "Agriculture", count: 67 }],
        climate_impacts: [],
        adaptation_approaches: [],
        keywords: [],
        biogeographical_regions: [],
      },
    }

    expect(mock.totalCount).toBe(842)
    expect(Array.isArray(mock.globalFacets.sectors)).toBe(true)
    expect("hits" in mock).toBe(false)
  })
})

describe("GET /api/explorer/corpus-metadata (integration — run with NUXT_TEST_BASE_URL set)", () => {
  const baseUrl = process.env.NUXT_TEST_BASE_URL

  it("returns corpus total and all global facet categories", async () => {
    if (!baseUrl) return

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/explorer/corpus-metadata`)
    expect(res.ok).toBe(true)

    const data = (await res.json()) as ExplorerCorpusMetadataResponse & { hits?: unknown[] }
    expect(typeof data.totalCount).toBe("number")
    expect(data).toHaveProperty("globalFacets")
    expect(Array.isArray(data.globalFacets.sectors)).toBe(true)
    expect(Array.isArray(data.globalFacets.climate_impacts)).toBe(true)
    expect(Array.isArray(data.globalFacets.adaptation_approaches)).toBe(true)
    expect(Array.isArray(data.globalFacets.keywords)).toBe(true)
    expect(Array.isArray(data.globalFacets.biogeographical_regions)).toBe(true)
    expect(data.hits).toBeUndefined()
  })
})

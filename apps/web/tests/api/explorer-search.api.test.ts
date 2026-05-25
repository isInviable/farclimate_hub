/**
 * API tests for POST /api/explorer-search.
 *
 * Integration tests require a running Nuxt server:
 * NUXT_TEST_BASE_URL=http://localhost:3000 pnpm test tests/api/explorer-search.api.test.ts
 */
import { describe, expect, it } from "vitest"
import type { ExplorerSearchResponse } from "../../app/types/explorerSearch"

describe("POST /api/explorer-search response contract", () => {
  const baseUrl = process.env.NUXT_TEST_BASE_URL

  it("returns full-match total and facet metadata separately from page hits", async () => {
    if (!baseUrl) return
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/explorer-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "",
        lang: "en",
        limit: 5,
        offset: 0,
        includeFacets: true,
        sectors: ["Disaster Risk Reduction", "Buildings"],
      }),
    })

    expect(res.ok).toBe(true)
    const data = (await res.json()) as ExplorerSearchResponse
    expect(typeof data.total).toBe("number")
    expect(data.hits.length).toBeLessThanOrEqual(5)
    expect(data.returned).toBe(data.hits.length)
    expect(data.facets?.for_result_set.sectors).toBeDefined()
  })

  it("accepts adaptation_approaches facet filter", async () => {
    if (!baseUrl) return
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/explorer-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "",
        lang: "en",
        limit: 5,
        offset: 0,
        includeFacets: true,
        adaptation_approaches: ["Ecosystem-based adaptation"],
      }),
    })

    expect(res.ok).toBe(true)
    const data = (await res.json()) as ExplorerSearchResponse
    expect(typeof data.total).toBe("number")
    expect(data.facets?.for_result_set.adaptation_approaches).toBeDefined()
  })

  it("omits facet metadata for page-only requests", async () => {
    if (!baseUrl) return
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/explorer-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "",
        lang: "en",
        limit: 5,
        offset: 5,
        includeFacets: false,
        sectors: ["Disaster Risk Reduction"],
      }),
    })

    expect(res.ok).toBe(true)
    const data = (await res.json()) as ExplorerSearchResponse
    expect(data.total).toBeUndefined()
    expect(data.facets).toBeUndefined()
    expect(data.offset).toBe(5)
    expect(data.hits.length).toBeLessThanOrEqual(5)
  })
})

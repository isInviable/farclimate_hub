/**
 * API tests for POST /api/facets — filter facets endpoint.
 * Serve as both regression tests and usage documentation.
 *
 * Run with: pnpm test (or npx vitest run tests/api/facets.api.test.ts)
 *
 * Integration tests (calling the real endpoint) require the Nuxt server.
 * To run against a running dev server: NUXT_TEST_BASE_URL=http://localhost:3000 pnpm test
 */
import { describe, it, expect } from "vitest"
import type { FilterFacetsResponse, FacetCategory } from "~/app/types/facets"

describe("Filter facets types and response shape", () => {
  it("FilterFacetsResponse has global and for_result_set with four categories each", () => {
    const mock: FilterFacetsResponse = {
      global: {
        sectors: [{ value: "Agriculture", count: 67 }],
        climate_impacts: [],
        adaptation_approaches: [],
        keywords: [],
      },
      for_result_set: {
        sectors: [],
        climate_impacts: [],
        adaptation_approaches: [],
        keywords: [],
      },
    }
    expect(mock.global).toBeDefined()
    expect(mock.for_result_set).toBeDefined()
    const categories: (keyof FacetCategory)[] = [
      "sectors",
      "climate_impacts",
      "adaptation_approaches",
      "keywords",
    ]
    for (const cat of categories) {
      expect(Array.isArray(mock.global[cat])).toBe(true)
      expect(Array.isArray(mock.for_result_set[cat])).toBe(true)
    }
    expect(mock.global.sectors[0]).toHaveProperty("value", "Agriculture")
    expect(mock.global.sectors[0]).toHaveProperty("count", 67)
  })
})

describe("POST /api/facets (integration — run with NUXT_TEST_BASE_URL set)", () => {
  const baseUrl = process.env.NUXT_TEST_BASE_URL

  it("returns global facets when no doc_ids are sent", async () => {
    if (!baseUrl) {
      console.warn("Skip: set NUXT_TEST_BASE_URL (e.g. http://localhost:3000) to run")
      return
    }
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/facets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.ok).toBe(true)
    const data = (await res.json()) as FilterFacetsResponse
    console.log(data)
    expect(data).toHaveProperty("global")
    expect(data).toHaveProperty("for_result_set")
    expect(Array.isArray(data.global.sectors)).toBe(true)
    if (data.global.sectors.length > 0) {
      expect(data.global.sectors[0]).toHaveProperty("value")
      expect(data.global.sectors[0]).toHaveProperty("count")
    }
  })

  it("returns for_result_set when doc_ids are sent", async () => {
    if (!baseUrl) return
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/facets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_ids: ["00000000-0000-0000-0000-000000000001"] }),
    })
    expect(res.ok).toBe(true)
    const data = (await res.json()) as FilterFacetsResponse
    expect(data.for_result_set).toBeDefined()
    expect(Array.isArray(data.for_result_set.sectors)).toBe(true)
  })
})

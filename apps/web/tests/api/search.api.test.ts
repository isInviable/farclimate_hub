/**
 * API tests for POST /api/search — hybrid search and facet filtering.
 * Run with: pnpm test (or npx vitest run tests/api/search.api.test.ts)
 * Integration: NUXT_TEST_BASE_URL=http://localhost:3000 pnpm test
 */
import { describe, it, expect } from "vitest"

describe("POST /api/search with facet params", () => {
  const baseUrl = process.env.NUXT_TEST_BASE_URL

  it("accepts optional sectors, climate_impacts, adaptation_approaches, keywords in body", async () => {
    if (!baseUrl) return
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "",
        lang: "en",
        limit: 10,
        sectors: ["Agriculture"],
        climate_impacts: [],
      }),
    })
    expect(res.ok).toBe(true)
    const data = (await res.json()) as { count: number; hits: unknown[] }
    expect(data).toHaveProperty("count")
    expect(Array.isArray(data.hits)).toBe(true)
    // When facets are applied, returned hits should only include documents that match
    for (const hit of data.hits as { document?: { sectors?: string[] } }[]) {
      const sectors = hit.document?.sectors ?? []
      if (sectors.length > 0) {
        expect(sectors).toContain("Agriculture")
      }
    }
  })

  it("returns same shape when no facet params sent", async () => {
    if (!baseUrl) return
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "", lang: "en", limit: 5 }),
    })
    expect(res.ok).toBe(true)
    const data = (await res.json()) as { count: number; hits: unknown[] }
    expect(data).toHaveProperty("count")
    expect(Array.isArray(data.hits)).toBe(true)
    expect(data.hits.length).toBeLessThanOrEqual(5)
    expect(data.count).toBeLessThanOrEqual(5)
  })
})

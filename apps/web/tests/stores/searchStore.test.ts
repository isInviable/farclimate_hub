import { beforeEach, describe, expect, it } from "vitest"
import { createPinia, setActivePinia } from "pinia"
import { useSearchStore } from "../../app/stores/search"
import type { ExplorerSearchHit } from "../../app/types/explorerSearch"

function hit(id: string): ExplorerSearchHit {
  return {
    id,
    document_uid: id,
    score: 1,
    document: {
      id,
      document_uid: id,
      title: `Document ${id}`,
    },
  }
}

describe("search store explorer page cache", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("retains loaded pages for the active search signature", () => {
    const store = useSearchStore()

    store.setExplorerSearchPage({
      signature: "sig-a",
      offset: 0,
      limit: 2,
      hits: [hit("1"), hit("2")],
      total: 4,
    })
    store.setExplorerSearchPage({
      signature: "sig-a",
      offset: 2,
      limit: 2,
      hits: [hit("3"), hit("4")],
    })

    expect(store.resultsData?.hits.map((item) => item.id)).toEqual(["3", "4"])
    expect(store.explorerAccumulatedHits.map((item) => item.id)).toEqual(["1", "2", "3", "4"])
    expect(store.explorerSearchTotal).toBe(4)
  })

  it("clears loaded pages when the search signature changes", () => {
    const store = useSearchStore()

    store.setExplorerSearchPage({
      signature: "sig-a",
      offset: 0,
      limit: 2,
      hits: [hit("1")],
      total: 1,
    })
    store.setExplorerSearchPage({
      signature: "sig-b",
      offset: 0,
      limit: 2,
      hits: [hit("2")],
      total: 1,
    })

    expect(Object.keys(store.explorerLoadedPages)).toEqual(["0"])
    expect(store.explorerAccumulatedHits.map((item) => item.id)).toEqual(["2"])
    expect(store.explorerSearchSignature).toBe("sig-b")
  })
})

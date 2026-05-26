import { describe, expect, it, vi } from "vitest"
import {
  PUBLIC_BOARD_TOKEN_PATTERN,
  createShareLink,
  getOrCreateShareLinkForProject,
  loadPublicBoardByToken,
  publicBoardPath,
} from "../../server/utils/publicBoardSharing"

const projectId = "11111111-1111-4111-8111-111111111111"
const userId = "22222222-2222-4222-8222-222222222222"

function projectShareLinksTable(options: {
  existing?: Record<string, unknown> | null
  inserted?: Record<string, unknown>
  byToken?: Record<string, unknown> | null
}) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn((column: string) => {
        if (column === "token") {
          return {
            maybeSingle: vi.fn(async () => ({ data: options.byToken ?? null, error: null })),
          }
        }
        return {
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: options.existing ?? null, error: null })),
            })),
          })),
        }
      }),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: options.inserted,
          error: null,
        })),
      })),
    })),
  }
}

function tableWithMaybeSingle(data: Record<string, unknown> | null) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => ({ data, error: null })),
      })),
    })),
  }
}

function pinsTable(rows: Record<string, unknown>[]) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(async () => ({ data: rows, error: null })),
        })),
      })),
    })),
  }
}

function supabaseWithTables(tables: Record<string, unknown>) {
  return {
    schema: vi.fn(() => ({
      from: vi.fn((name: string) => tables[name]),
    })),
  }
}

describe("public board sharing helpers", () => {
  it("creates URL-safe non-project tokens and paths", async () => {
    const inserted = {
      id: "share-1",
      project_id: projectId,
      token: "token_1234567890abcdefghijklmnopqrstuvwxyzABCDEFG",
      enabled: true,
      revoked_at: null,
    }
    const supabase = supabaseWithTables({
      project_share_links: projectShareLinksTable({ inserted }),
    })

    const share = await createShareLink(supabase as never, projectId, userId)

    expect(share.token).not.toBe(projectId)
    expect(share.token).toMatch(PUBLIC_BOARD_TOKEN_PATTERN)
    expect(publicBoardPath(share.token)).toBe(`/explorer/board/public/${share.token}`)
  })

  it("reuses an existing enabled share token for a project", async () => {
    const existing = {
      id: "share-1",
      project_id: projectId,
      token: "existing_1234567890abcdefghijklmnopqrstuvwxyzAB",
      enabled: true,
      revoked_at: null,
    }
    const table = projectShareLinksTable({ existing })
    const supabase = supabaseWithTables({ project_share_links: table })

    const share = await getOrCreateShareLinkForProject(supabase as never, projectId, userId)

    expect(share.token).toBe(existing.token)
    expect(table.insert).not.toHaveBeenCalled()
  })

  it("loads a public board from an enabled token with ordered pin payload", async () => {
    const pins = [
      {
        id: "pin-1",
        pinboard_id: "board-1",
        source_document_uid: "doc-1",
        source_title_snapshot: "Doc 1",
        body_kind: "document",
        body: { v: 1, data: {} },
        user_note: null,
        sort_order: 0,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ]
    const supabase = supabaseWithTables({
      project_share_links: projectShareLinksTable({
        byToken: { project_id: projectId, enabled: true, revoked_at: null },
      }),
      projects: tableWithMaybeSingle({ id: projectId, name: "Research Board" }),
      pinboards: tableWithMaybeSingle({ id: "board-1" }),
      pins: pinsTable(pins),
    })

    const result = await loadPublicBoardByToken(
      supabase as never,
      "token_1234567890abcdefghijklmnopqrstuvwxyzABCDEFG"
    )

    expect(result.project).toEqual({ id: projectId, name: "Research Board" })
    expect(result.pins).toEqual(pins)
  })

  it("rejects disabled or revoked tokens", async () => {
    const supabase = supabaseWithTables({
      project_share_links: projectShareLinksTable({
        byToken: { project_id: projectId, enabled: false, revoked_at: null },
      }),
    })

    await expect(
      loadPublicBoardByToken(supabase as never, "token_1234567890abcdefghijklmnopqrstuvwxyzABCDEFG")
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})

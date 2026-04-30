/**
 * `POST /api/pinboard-export` uses the same `assertOwnProject` gate as other artifact routes.
 * Live integration tests against Supabase are optional and not required in CI when credentials are absent.
 */
import { describe, expect, it, vi } from "vitest"
import { assertOwnProject } from "../../server/utils/podcastSupabase"

describe("pinboard export uses project ownership gate", () => {
  it("assertOwnProject rejects when owner does not match", async () => {
    const maybeSingle = vi.fn(async () => ({
      data: { id: "proj-x", owner_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      error: null,
    }))
    const supabase = {
      schema: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle })),
          })),
        })),
      })),
    }
    await expect(
      assertOwnProject(supabase as never, "proj-x", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})

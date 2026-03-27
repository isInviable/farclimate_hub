/**
 * Integration tests: human.pinboards + human.pins RLS and project trigger.
 *
 * Required env (skip all tests if any missing):
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY
 * - SUPABASE_TEST_EMAIL
 * - SUPABASE_TEST_PASSWORD
 *
 * Optional (cross-user isolation; skip those cases if missing):
 * - SUPABASE_TEST_USER2_EMAIL
 * - SUPABASE_TEST_USER2_PASSWORD
 *
 * Run: pnpm --filter web test:human-pins
 * Or:  pnpm --filter web exec vitest run tests/human/pinboards.rls.test.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { describe, it, expect, beforeAll, afterAll } from "vitest"

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const userAEmail = process.env.SUPABASE_TEST_EMAIL
const userAPassword = process.env.SUPABASE_TEST_PASSWORD
const userBEmail = process.env.SUPABASE_TEST_USER2_EMAIL
const userBPassword = process.env.SUPABASE_TEST_USER2_PASSWORD

const shouldRun = Boolean(url && anonKey && userAEmail && userAPassword)

function client(): SupabaseClient {
  return createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Non-`public` tables: use `.schema("human").from("projects")`. `.from("human.projects")` becomes `public."human.projects"` and PostgREST returns PGRST205. */
function human(sb: SupabaseClient) {
  return sb.schema("human")
}

const validBody = { v: 1 as const, data: { markdown: "hello" } }

describe.skipIf(!shouldRun)("human pinboards & pins (Supabase RLS)", () => {
  let supabaseA: SupabaseClient
  let projectId: string
  let pinboardId: string

  beforeAll(async () => {
    supabaseA = client()
    const { data: auth, error: signErr } = await supabaseA.auth.signInWithPassword({
      email: userAEmail!,
      password: userAPassword!,
    })
    expect(signErr, signErr?.message).toBeNull()
    expect(auth.user).toBeTruthy()

    const suffix = `pins-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const { data: proj, error: pErr } = await human(supabaseA)
      .from("projects")
      .insert({ name: `rls-test-${suffix}`, owner_user_id: auth.user!.id })
      .select("id")
      .single()
    expect(pErr, pErr?.message).toBeNull()
    expect(proj?.id).toBeTruthy()
    projectId = proj!.id

    const { data: boards, error: bErr } = await human(supabaseA)
      .from("pinboards")
      .select("id")
      .eq("project_id", projectId)
    expect(bErr, bErr?.message).toBeNull()
    expect(boards).toHaveLength(1)
    pinboardId = boards![0]!.id
  })

  afterAll(async () => {
    if (!projectId) return
    await human(supabaseA).from("projects").delete().eq("id", projectId)
    await supabaseA.auth.signOut()
  })

  // Single sequential flow (Vitest runs tests in parallel by default).
  it("RLS, body envelope, CRUD, cascade, anon, optional cross-user", async () => {
    const { error: badBody } = await human(supabaseA).from("pins").insert({
      pinboard_id: pinboardId,
      body_kind: "text_segment",
      body: { v: 2, data: {} },
    })
    expect(badBody).not.toBeNull()

    const { data: inserted, error: insErr } = await human(supabaseA)
      .from("pins")
      .insert({
        pinboard_id: pinboardId,
        body_kind: "text_segment",
        body: validBody,
        user_note: "note",
        sort_order: 1,
        source_document_uid: "climateadapt::fake-slug",
        source_title_snapshot: "Fake title",
      })
      .select("id")
      .single()
    expect(insErr, insErr?.message).toBeNull()
    const pinId = inserted!.id

    const { error: updErr } = await human(supabaseA)
      .from("pins")
      .update({ user_note: "updated", sort_order: 2 })
      .eq("id", pinId)
    expect(updErr, updErr?.message).toBeNull()

    const { data: rows, error: selErr } = await human(supabaseA)
      .from("pins")
      .select("id, user_note, sort_order")
      .eq("id", pinId)
      .single()
    expect(selErr, selErr?.message).toBeNull()
    expect(rows?.user_note).toBe("updated")

    const { error: delErr } = await human(supabaseA).from("pins").delete().eq("id", pinId)
    expect(delErr, delErr?.message).toBeNull()

    const { data: auth } = await supabaseA.auth.getUser()
    expect(auth.user).toBeTruthy()
    const suffix = `cascade-${Date.now()}`
    const { data: proj2, error: pErr2 } = await human(supabaseA)
      .from("projects")
      .insert({ name: `cascade-${suffix}`, owner_user_id: auth.user!.id })
      .select("id")
      .single()
    expect(pErr2, pErr2?.message).toBeNull()
    const pid = proj2!.id
    const { data: boards2 } = await human(supabaseA).from("pinboards").select("id").eq("project_id", pid)
    await human(supabaseA).from("pins").insert({
      pinboard_id: boards2![0]!.id,
      body_kind: "text_segment",
      body: validBody,
    })
    const { error: delProjErr } = await human(supabaseA).from("projects").delete().eq("id", pid)
    expect(delProjErr, delProjErr?.message).toBeNull()
    const { data: boardsAfter } = await human(supabaseA).from("pinboards").select("id").eq("project_id", pid)
    expect(boardsAfter ?? []).toHaveLength(0)

    const anonOnly = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: anonIns } = await human(anonOnly).from("pins").insert({
      pinboard_id: pinboardId,
      body_kind: "text_segment",
      body: validBody,
    })
    expect(anonIns).not.toBeNull()

    if (userBEmail && userBPassword) {
      const supabaseB = client()
      const { error: bSign } = await supabaseB.auth.signInWithPassword({
        email: userBEmail,
        password: userBPassword,
      })
      expect(bSign, bSign?.message).toBeNull()
      const { data: leakedPins } = await human(supabaseB).from("pins").select("id").eq("pinboard_id", pinboardId)
      expect(leakedPins ?? []).toHaveLength(0)
      const { data: leakedBoards } = await human(supabaseB).from("pinboards").select("id").eq("id", pinboardId)
      expect(leakedBoards ?? []).toHaveLength(0)
      const { error: crossIns } = await human(supabaseB).from("pins").insert({
        pinboard_id: pinboardId,
        body_kind: "text_segment",
        body: validBody,
      })
      expect(crossIns).not.toBeNull()
      await supabaseB.auth.signOut()
    }
  })
})

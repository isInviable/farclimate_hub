/**
 * Integration tests: human.artifacts RLS and owner isolation.
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
 * Run: pnpm --filter web exec vitest run tests/human/artifacts.rls.test.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

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

function human(sb: SupabaseClient) {
  return sb.schema("human")
}

describe.skipIf(!shouldRun)("human artifacts (Supabase RLS)", () => {
  let supabaseA: SupabaseClient
  let projectId: string
  let ownerUserId: string

  beforeAll(async () => {
    supabaseA = client()
    const { data: auth, error: signErr } = await supabaseA.auth.signInWithPassword({
      email: userAEmail!,
      password: userAPassword!,
    })
    expect(signErr, signErr?.message).toBeNull()
    expect(auth.user).toBeTruthy()
    ownerUserId = auth.user!.id

    const suffix = `artifacts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const { data: proj, error: pErr } = await human(supabaseA)
      .from("projects")
      .insert({ name: `artifact-rls-test-${suffix}`, owner_user_id: ownerUserId })
      .select("id")
      .single()
    expect(pErr, pErr?.message).toBeNull()
    expect(proj?.id).toBeTruthy()
    projectId = proj!.id
  })

  afterAll(async () => {
    if (projectId) {
      await human(supabaseA).from("projects").delete().eq("id", projectId)
    }
    await supabaseA?.auth.signOut()
  })

  it("owner CRUD, anon denial, and optional cross-user isolation", async () => {
    const artifactPayload = {
      project_id: projectId,
      owner_user_id: ownerUserId,
      kind: "podcast",
      status: "ready",
      title: "RLS test podcast",
      bucket_id: "human-artifacts",
      object_path: `${ownerUserId}/${projectId}/fake-artifact/podcast.mp3`,
      mime_type: "audio/mpeg",
      byte_size: 123,
      metadata: { test: true },
      source_pin_ids: [],
    }

    const { data: inserted, error: insErr } = await human(supabaseA)
      .from("artifacts")
      .insert(artifactPayload)
      .select("id, title, status")
      .single()
    expect(insErr, insErr?.message).toBeNull()
    expect(inserted?.id).toBeTruthy()
    const artifactId = inserted!.id

    const { error: updErr } = await human(supabaseA)
      .from("artifacts")
      .update({ title: "Updated podcast" })
      .eq("id", artifactId)
    expect(updErr, updErr?.message).toBeNull()

    const { data: ownRows, error: ownErr } = await human(supabaseA)
      .from("artifacts")
      .select("id, title")
      .eq("id", artifactId)
    expect(ownErr, ownErr?.message).toBeNull()
    expect(ownRows).toHaveLength(1)
    expect(ownRows![0]!.title).toBe("Updated podcast")

    const anonOnly = createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: anonIns } = await human(anonOnly).from("artifacts").insert(artifactPayload)
    expect(anonIns).not.toBeNull()

    if (userBEmail && userBPassword) {
      const supabaseB = client()
      const { error: bSign } = await supabaseB.auth.signInWithPassword({
        email: userBEmail,
        password: userBPassword,
      })
      expect(bSign, bSign?.message).toBeNull()

      const { data: leaked } = await human(supabaseB)
        .from("artifacts")
        .select("id")
        .eq("id", artifactId)
      expect(leaked ?? []).toHaveLength(0)

      const { error: crossIns } = await human(supabaseB).from("artifacts").insert(artifactPayload)
      expect(crossIns).not.toBeNull()
      await supabaseB.auth.signOut()
    }

    const { error: delErr } = await human(supabaseA).from("artifacts").delete().eq("id", artifactId)
    expect(delErr, delErr?.message).toBeNull()
  })
})

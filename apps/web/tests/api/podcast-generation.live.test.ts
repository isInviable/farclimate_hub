/**
 * Opt-in live test for the podcast endpoints.
 *
 * This calls the running Nuxt server, Gemini, Google Text-to-Speech, and
 * Supabase Storage. It writes local files under apps/web/test-output/.
 *
 * Required env:
 * - RUN_PODCAST_LIVE_TEST=1
 * - NUXT_TEST_BASE_URL=http://localhost:3000
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY
 * - SUPABASE_TEST_EMAIL
 * - SUPABASE_TEST_PASSWORD
 * - PODCAST_TEST_PROJECT_ID      Optional UUID of a project owned by SUPABASE_TEST_EMAIL.
 *                                If missing or not a UUID, the test uses the first owned project.
 *
 * Provider env used by the Nuxt server:
 * - GOOGLE_GENERATIVE_AI_API_KEY for Gemini summarization
 * - GOOGLE_TTS_API_KEY for Text-to-Speech
 *
 * Run:
 *   RUN_PODCAST_LIVE_TEST=1 pnpm test:podcast-live
 */
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { createClient } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"

const shouldRun = process.env.RUN_PODCAST_LIVE_TEST === "1"
const baseUrl = process.env.NUXT_TEST_BASE_URL?.replace(/\/$/, "")
const supabaseUrl = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const email = process.env.SUPABASE_TEST_EMAIL
const password = process.env.SUPABASE_TEST_PASSWORD
const configuredProjectId = process.env.PODCAST_TEST_PROJECT_ID
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface SummarizeResponse {
  script: string
  sourceCount: number
  generatedAt: string
  model: string
}

interface TtsResponse {
  artifact: {
    id: string
    bucketId: string
    objectPath: string
    mimeType: string
    byteSize: number
  }
}

interface LiveSession {
  accessToken: string
  userId: string
}

async function requiredSession(): Promise<LiveSession> {
  if (!supabaseUrl || !anonKey || !email || !password) {
    throw new Error("Missing Supabase test env for live podcast test")
  }
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error || !data.session?.access_token) {
    throw new Error(error?.message ?? "Could not sign in test user")
  }
  if (!data.user?.id) {
    throw new Error("Could not resolve signed-in test user id")
  }
  return {
    accessToken: data.session.access_token,
    userId: data.user.id,
  }
}

function authenticatedSupabase(accessToken: string) {
  if (!supabaseUrl || !anonKey) throw new Error("Missing Supabase env")
  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

async function resolveOwnedProjectId(session: LiveSession): Promise<string> {
  if (configuredProjectId && UUID_RE.test(configuredProjectId)) {
    return configuredProjectId
  }

  const supabase = authenticatedSupabase(session.accessToken)
  const { data, error } = await supabase
    .schema("human")
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Could not load owned project: ${error.message}`)
  if (!data?.id) {
    const suffix = `podcast-live-${Date.now()}`
    const { data: created, error: createError } = await supabase
      .schema("human")
      .from("projects")
      .insert({
        name: `Podcast live test ${suffix}`,
        owner_user_id: session.userId,
      })
      .select("id")
      .single()
    if (createError || !created?.id) {
      throw new Error(
        `No owned project found and could not create one: ${createError?.message ?? "missing created id"}`
      )
    }
    console.warn(`Created temporary podcast live test project ${created.id}.`)
    return created.id as string
  }

  if (configuredProjectId) {
    console.warn(
      `Ignoring PODCAST_TEST_PROJECT_ID=${configuredProjectId} because it is not a UUID; using owned project ${data.id}.`
    )
  }
  return data.id as string
}

async function downloadArtifact(params: {
  accessToken: string
  bucketId: string
  objectPath: string
}): Promise<Uint8Array> {
  const supabase = authenticatedSupabase(params.accessToken)
  const { data, error } = await supabase.storage
    .from(params.bucketId)
    .download(params.objectPath)
  if (error || !data) {
    throw new Error(error?.message ?? "Could not download generated MP3")
  }
  return new Uint8Array(await data.arrayBuffer())
}

describe.skipIf(!shouldRun)("podcast generation endpoints live", () => {
  it("creates a summary script and downloadable MP3", async () => {
    if (!baseUrl) throw new Error("Missing NUXT_TEST_BASE_URL")
    const session = await requiredSession()
    const accessToken = session.accessToken
    const projectId = await resolveOwnedProjectId(session)
    const outDir = join(process.cwd(), "test-output", "podcast-generation")
    await mkdir(outDir, { recursive: true })

    const summarizeRes = await fetch(`${baseUrl}/api/podcast-summarize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        extraInstructions:
          "Make it concise, practical, and suitable for a two-minute podcast.",
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            title: "Coastal adaptation example",
            bodyKind: "document",
            sourceDocumentUid: "doc-coastal-1",
            userNote: "Important for municipalities",
            data: {
              markdown:
                "Mangrove restoration can reduce wave energy, protect coastal communities, and support biodiversity. It requires local governance, long-term maintenance, and monitoring.",
            },
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            title: "Urban heat adaptation",
            bodyKind: "selected_text",
            sourceDocumentUid: "doc-urban-heat-1",
            data: {
              quote:
                "Shade corridors, cool roofs, and urban trees can lower heat stress in dense neighborhoods, especially for vulnerable populations.",
            },
          },
        ],
      }),
    })
    const summarizeBody = await summarizeRes.text()
    expect(summarizeRes.ok, summarizeBody).toBe(true)
    const summary = JSON.parse(summarizeBody) as SummarizeResponse
    expect(summary.script.length).toBeGreaterThan(100)

    await writeFile(
      join(outDir, "summary.md"),
      `# Podcast Summary\n\nGenerated: ${summary.generatedAt}\nModel: ${summary.model}\nSources: ${summary.sourceCount}\n\n${summary.script}\n`,
      "utf8"
    )

    const ttsRes = await fetch(`${baseUrl}/api/podcast-text-to-speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        title: "Live podcast endpoint test",
        script: summary.script,
        sourcePinIds: [],
        metadata: {
          source: "vitest-live-podcast-test",
        },
        voice: {
          languageCode: "en-US",
          ssmlGender: "NEUTRAL",
        },
        ssml: false,
      }),
    })
    const ttsBody = await ttsRes.text()
    expect(ttsRes.ok, ttsBody).toBe(true)
    const tts = JSON.parse(ttsBody) as TtsResponse
    expect(tts.artifact.mimeType).toBe("audio/mpeg")

    await writeFile(
      join(outDir, "artifact.json"),
      `${JSON.stringify(tts.artifact, null, 2)}\n`,
      "utf8"
    )

    const audio = await downloadArtifact({
      accessToken,
      bucketId: tts.artifact.bucketId,
      objectPath: tts.artifact.objectPath,
    })
    expect(audio.byteLength).toBeGreaterThan(1000)
    await writeFile(join(outDir, "podcast.mp3"), audio)

    console.log(`Podcast live test output written to: ${outDir}`)
  }, 120_000)
})

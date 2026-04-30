import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildPodcastPrompt,
  fitTextToUtf8Bytes,
  normalizePodcastSummarizeRequest,
  PODCAST_MAX_TTS_INPUT_BYTES,
  validatePodcastContext,
  validatePodcastScript,
} from "../../server/utils/podcastContext"
import {
  createPodcastAudioArtifact,
  normalizePodcastTtsRequest,
  synthesizePodcastSpeech,
  validatePodcastTtsRequest,
} from "../../server/utils/podcastTextToSpeech"

const ttsMocks = vi.hoisted(() => ({
  synthesizeSpeech: vi.fn(),
}))

vi.mock("@google-cloud/text-to-speech", () => ({
  default: {
    TextToSpeechClient: vi.fn(() => ({
      synthesizeSpeech: ttsMocks.synthesizeSpeech,
    })),
  },
}))

function projectQuery(ownerUserId: string) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => ({
          data: { id: "project-1", owner_user_id: ownerUserId },
          error: null,
        })),
      })),
    })),
  }
}

function artifactInsertQuery(payloads: unknown[], error?: { message: string }) {
  return {
    insert: vi.fn((payload: unknown) => {
      payloads.push(payload)
      return {
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: error
              ? null
              : {
                  ...(payload as Record<string, unknown>),
                  created_at: "2026-04-30T00:00:00.000Z",
                  updated_at: "2026-04-30T00:00:00.000Z",
                },
            error: error ?? null,
          })),
        })),
      }
    }),
  }
}

function fakeSupabase(ownerUserId: string, insertError?: { message: string }) {
  const uploads: unknown[] = []
  const removals: unknown[] = []
  const inserts: unknown[] = []
  const artifacts = artifactInsertQuery(inserts, insertError)
  const projects = projectQuery(ownerUserId)

  return {
    uploads,
    removals,
    inserts,
    client: {
      schema: vi.fn(() => ({
        from: vi.fn((table: string) => (table === "projects" ? projects : artifacts)),
      })),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(async (...args: unknown[]) => {
            uploads.push(args)
            return { error: null }
          }),
          remove: vi.fn(async (...args: unknown[]) => {
            removals.push(args)
            return { error: null }
          }),
        })),
      },
    },
  }
}

describe("podcast summarize context", () => {
  it("rejects empty selection before an LLM call is needed", () => {
    const request = normalizePodcastSummarizeRequest({ items: [] })
    expect(validatePodcastContext(request)).toEqual({
      ok: false,
      message: "At least one selected item is required",
    })
  })

  it("preserves selected source boundaries and user instructions in the prompt", () => {
    const request = normalizePodcastSummarizeRequest({
      extraInstructions: "Make it practical and short.",
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "Coastal adaptation",
          bodyKind: "document",
          sourceDocumentUid: "doc-1",
          userNote: "Important for municipalities",
          data: { markdown: "Mangroves reduce wave energy." },
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "Urban heat",
          data: { quote: "Shade corridors lower heat stress." },
        },
      ],
    })

    expect(validatePodcastContext(request).ok).toBe(true)
    const prompt = buildPodcastPrompt(request)
    expect(prompt).toContain("Source 1")
    expect(prompt).toContain("Pin id: 11111111-1111-4111-8111-111111111111")
    expect(prompt).toContain("User note: Important for municipalities")
    expect(prompt).toContain("Mangroves reduce wave energy.")
    expect(prompt).toContain("Source 2")
    expect(prompt).toContain("Shade corridors lower heat stress.")
    expect(prompt).toContain("Make it practical and short.")
    expect(prompt).toContain("at most 3800 UTF-8 bytes")
  })

  it("fits generated scripts to the Google Text-to-Speech byte limit", () => {
    const longSpanish = "Adaptación climática con árboles urbanos. ".repeat(300)
    const fitted = fitTextToUtf8Bytes(longSpanish)
    expect(Buffer.byteLength(fitted, "utf8")).toBeLessThanOrEqual(PODCAST_MAX_TTS_INPUT_BYTES)
    expect(fitted.length).toBeGreaterThan(0)
  })
})

describe("podcast text-to-speech", () => {
  beforeEach(() => {
    ttsMocks.synthesizeSpeech.mockReset()
    vi.unstubAllGlobals()
  })

  it("validates required project and script inputs", () => {
    const missingProject = normalizePodcastTtsRequest({ script: "Hello" })
    expect(validatePodcastTtsRequest(missingProject)).toEqual({
      ok: false,
      message: "projectId is required",
    })

    const missingScript = normalizePodcastTtsRequest({ projectId: "project-1", script: "" })
    expect(validatePodcastTtsRequest(missingScript)).toEqual({
      ok: false,
      message: "Podcast script is required",
    })

    expect(validatePodcastScript("á".repeat(2_001))).toEqual({
      ok: false,
      message: "Podcast script is too long; maximum is 4000 UTF-8 bytes",
    })
  })

  it("calls Google Text-to-Speech with MP3 output", async () => {
    ttsMocks.synthesizeSpeech.mockResolvedValueOnce([
      { audioContent: Uint8Array.from([1, 2, 3]) },
    ])

    const result = await synthesizePodcastSpeech({
      script: "Hello climate adaptation listeners.",
      ssml: false,
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
    })

    expect(result.audio).toEqual(Uint8Array.from([1, 2, 3]))
    expect(result.mimeType).toBe("audio/mpeg")
    expect(ttsMocks.synthesizeSpeech).toHaveBeenCalledWith({
      input: { text: "Hello climate adaptation listeners." },
      voice: {
        languageCode: "en-US",
        name: undefined,
        ssmlGender: "NEUTRAL",
      },
      audioConfig: { audioEncoding: "MP3" },
    })
  })

  it("uses the Google Text-to-Speech REST API when an API key is configured", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        audioContent: Buffer.from(Uint8Array.from([4, 5, 6])).toString("base64"),
      }),
    }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await synthesizePodcastSpeech({
      script: "Hello via REST.",
      ssml: false,
      apiKey: "test-api-key",
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
    })

    expect(result.audio).toEqual(Uint8Array.from([4, 5, 6]))
    expect(fetchMock).toHaveBeenCalledWith(
      "https://texttospeech.googleapis.com/v1/text:synthesize?key=test-api-key",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: "Hello via REST." },
          voice: {
            languageCode: "en-US",
            ssmlGender: "NEUTRAL",
          },
          audioConfig: { audioEncoding: "MP3" },
        }),
      })
    )
    expect(ttsMocks.synthesizeSpeech).not.toHaveBeenCalled()
  })

  it("uploads audio and inserts ready artifact metadata", async () => {
    const fake = fakeSupabase("user-1")
    const request = normalizePodcastTtsRequest({
      projectId: "project-1",
      script: "Reviewed podcast script",
      title: "Podcast",
      sourcePinIds: ["11111111-1111-4111-8111-111111111111"],
    })

    const artifact = await createPodcastAudioArtifact({
      supabase: fake.client as never,
      userId: "user-1",
      request,
      bucketId: "human-artifacts",
      artifactId: "artifact-1",
      synthesize: async () => ({
        audio: Uint8Array.from([1, 2, 3, 4]),
        mimeType: "audio/mpeg",
      }),
    })

    expect(fake.uploads).toHaveLength(1)
    expect(fake.inserts[0]).toMatchObject({
      id: "artifact-1",
      project_id: "project-1",
      owner_user_id: "user-1",
      kind: "podcast",
      status: "ready",
      title: "Podcast",
      bucket_id: "human-artifacts",
      object_path: "user-1/project-1/artifact-1/podcast.mp3",
      mime_type: "audio/mpeg",
      byte_size: 4,
      source_pin_ids: ["11111111-1111-4111-8111-111111111111"],
    })
    expect(artifact.objectPath).toBe("user-1/project-1/artifact-1/podcast.mp3")
  })

  it("denies artifact creation when the project is not owned by the user", async () => {
    const fake = fakeSupabase("other-user")
    const request = normalizePodcastTtsRequest({
      projectId: "project-1",
      script: "Reviewed podcast script",
    })

    await expect(
      createPodcastAudioArtifact({
        supabase: fake.client as never,
        userId: "user-1",
        request,
        bucketId: "human-artifacts",
        artifactId: "artifact-1",
        synthesize: async () => ({
          audio: Uint8Array.from([1]),
          mimeType: "audio/mpeg",
        }),
      })
    ).rejects.toThrow("Project not found or not owned by current user")

    expect(fake.uploads).toHaveLength(0)
    expect(fake.inserts).toHaveLength(0)
  })

  it("cleans up uploaded audio when artifact insertion fails", async () => {
    const fake = fakeSupabase("user-1", { message: "insert failed" })
    const request = normalizePodcastTtsRequest({
      projectId: "project-1",
      script: "Reviewed podcast script",
    })

    await expect(
      createPodcastAudioArtifact({
        supabase: fake.client as never,
        userId: "user-1",
        request,
        bucketId: "human-artifacts",
        artifactId: "artifact-1",
        synthesize: async () => ({
          audio: Uint8Array.from([1, 2, 3, 4]),
          mimeType: "audio/mpeg",
        }),
      })
    ).rejects.toThrow("insert failed")

    expect(fake.uploads).toHaveLength(1)
    expect(fake.removals).toHaveLength(1)
    expect(fake.removals[0]).toEqual([["user-1/project-1/artifact-1/podcast.mp3"]])
  })
})

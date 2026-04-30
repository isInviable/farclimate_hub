import { randomUUID } from "node:crypto"
import textToSpeech from "@google-cloud/text-to-speech"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createError } from "h3"
import type { ArtifactMetadataResponse } from "~/types/artifacts"
import type { PodcastVoiceOptions } from "~/types/podcastGeneration"
import { validatePodcastScript } from "./podcastContext"
import {
  assertOwnProject,
  insertPodcastArtifact,
  podcastArtifactObjectPath,
  removeArtifactObject,
  uploadArtifactAudio,
  type InsertPodcastArtifactInput,
} from "./podcastSupabase"

const DEFAULT_LANGUAGE_CODE = "en-US"
const DEFAULT_SSML_GENDER = "NEUTRAL"
const ALLOWED_SSML_GENDERS = new Set([
  "SSML_VOICE_GENDER_UNSPECIFIED",
  "MALE",
  "FEMALE",
  "NEUTRAL",
] as const)

export interface NormalizedPodcastTtsRequest {
  projectId: string
  script: string
  title: string | null
  sourcePinIds: string[]
  metadata: Record<string, unknown>
  voice: Required<Pick<PodcastVoiceOptions, "languageCode" | "ssmlGender">> & {
    name?: string
  }
  ssml: boolean
}

export interface SynthesizePodcastSpeechInput {
  script: string
  voice: NormalizedPodcastTtsRequest["voice"]
  ssml: boolean
  apiKey?: string
}

export interface SynthesizePodcastSpeechResult {
  audio: Uint8Array
  mimeType: "audio/mpeg"
}

function normalizeSsmlGender(
  value: unknown,
  fallback: unknown
): NormalizedPodcastTtsRequest["voice"]["ssmlGender"] {
  const candidate = typeof value === "string" && value.trim()
    ? value.trim()
    : typeof fallback === "string" && fallback.trim()
      ? fallback.trim()
      : DEFAULT_SSML_GENDER
  return ALLOWED_SSML_GENDERS.has(
    candidate as NormalizedPodcastTtsRequest["voice"]["ssmlGender"]
  )
    ? (candidate as NormalizedPodcastTtsRequest["voice"]["ssmlGender"])
    : DEFAULT_SSML_GENDER
}

export function normalizePodcastTtsRequest(
  body: unknown,
  defaults: {
    languageCode?: string
    voiceName?: string
    ssmlGender?: string
  } = {}
): NormalizedPodcastTtsRequest {
  const input = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {}
  const voiceInput =
    input.voice && typeof input.voice === "object" && !Array.isArray(input.voice)
      ? (input.voice as Record<string, unknown>)
      : {}

  const script = typeof input.script === "string" ? input.script.trim() : ""
  const projectId = typeof input.projectId === "string" ? input.projectId.trim() : ""
  const title = typeof input.title === "string" && input.title.trim()
    ? input.title.trim()
    : null
  const sourcePinIds = Array.isArray(input.sourcePinIds)
    ? input.sourcePinIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : []
  const metadata =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : {}

  return {
    projectId,
    script,
    title,
    sourcePinIds,
    metadata,
    voice: {
      languageCode:
        (typeof voiceInput.languageCode === "string" && voiceInput.languageCode.trim()) ||
        defaults.languageCode ||
        DEFAULT_LANGUAGE_CODE,
      name:
        (typeof voiceInput.name === "string" && voiceInput.name.trim()) ||
        defaults.voiceName ||
        undefined,
      ssmlGender: normalizeSsmlGender(voiceInput.ssmlGender, defaults.ssmlGender),
    },
    ssml: input.ssml === true,
  }
}

export function validatePodcastTtsRequest(
  request: NormalizedPodcastTtsRequest
): { ok: boolean; message?: string } {
  if (!request.projectId) return { ok: false, message: "projectId is required" }
  return validatePodcastScript(request.script)
}

export async function synthesizePodcastSpeech(
  input: SynthesizePodcastSpeechInput
): Promise<SynthesizePodcastSpeechResult> {
  if (input.apiKey) {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(input.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: input.ssml ? { ssml: input.script } : { text: input.script },
          voice: {
            languageCode: input.voice.languageCode,
            name: input.voice.name,
            ssmlGender: input.voice.ssmlGender,
          },
          audioConfig: { audioEncoding: "MP3" },
        }),
      }
    )

    if (!response.ok) {
      const message = await response.text().catch(() => "")
      throw createError({
        statusCode: 502,
        message: message || "Google Text-to-Speech request failed",
      })
    }

    const data = (await response.json()) as { audioContent?: string }
    if (!data.audioContent) {
      throw createError({
        statusCode: 502,
        message: "Google Text-to-Speech did not return audio content",
      })
    }

    return {
      audio: Uint8Array.from(Buffer.from(data.audioContent, "base64")),
      mimeType: "audio/mpeg",
    }
  }

  const client = new textToSpeech.TextToSpeechClient()
  const [response] = await client.synthesizeSpeech({
    input: input.ssml ? { ssml: input.script } : { text: input.script },
    voice: {
      languageCode: input.voice.languageCode,
      name: input.voice.name,
      ssmlGender: input.voice.ssmlGender,
    },
    audioConfig: { audioEncoding: "MP3" },
  })

  const content = response.audioContent
  if (!content) {
    throw createError({
      statusCode: 502,
      message: "Google Text-to-Speech did not return audio content",
    })
  }

  const audio =
    typeof content === "string"
      ? Uint8Array.from(Buffer.from(content, "base64"))
      : content instanceof Uint8Array
        ? content
        : Uint8Array.from(content as Buffer)

  return { audio, mimeType: "audio/mpeg" }
}

export async function createPodcastAudioArtifact(params: {
  supabase: SupabaseClient
  userId: string
  request: NormalizedPodcastTtsRequest
  bucketId: string
  googleTtsApiKey?: string
  synthesize?: typeof synthesizePodcastSpeech
  artifactId?: string
}): Promise<ArtifactMetadataResponse> {
  await assertOwnProject(params.supabase, params.request.projectId, params.userId)

  const artifactId = params.artifactId ?? randomUUID()
  const objectPath = podcastArtifactObjectPath({
    ownerUserId: params.userId,
    projectId: params.request.projectId,
    artifactId,
  })
  const synthesize = params.synthesize ?? synthesizePodcastSpeech
  const speech = await synthesize({
    script: params.request.script,
    voice: params.request.voice,
    ssml: params.request.ssml,
    apiKey: params.googleTtsApiKey,
  })

  await uploadArtifactAudio({
    supabase: params.supabase,
    bucketId: params.bucketId,
    objectPath,
    audio: speech.audio,
    contentType: speech.mimeType,
  })

  const metadata = {
    ...params.request.metadata,
    provider: "google-cloud-text-to-speech",
    voice: params.request.voice,
    ssml: params.request.ssml,
  }

  const insertInput: InsertPodcastArtifactInput = {
    id: artifactId,
    projectId: params.request.projectId,
    ownerUserId: params.userId,
    title: params.request.title,
    bucketId: params.bucketId,
    objectPath,
    byteSize: speech.audio.byteLength,
    metadata,
    sourcePinIds: params.request.sourcePinIds,
  }

  try {
    return await insertPodcastArtifact(params.supabase, insertInput)
  } catch (error) {
    await removeArtifactObject({
      supabase: params.supabase,
      bucketId: params.bucketId,
      objectPath,
    })
    throw error
  }
}

import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'

export const summarySchema = z.object({
  summary: z.string(),
  data: z.string(),
})

export type PropertySummaryStructured = z.infer<typeof summarySchema>

/** Shared with single-item route; keyed by client `cacheId`. */
export const propertySummaryCache = new Map<
  string,
  { response: PropertySummaryStructured; timestamp: string }
>()

const MAX_INPUT_CHARS = 28_000

export function truncatePropertySummaryInput(text: string): string {
  const t = text.trim()
  if (t.length <= MAX_INPUT_CHARS) return t
  return `${t.slice(0, MAX_INPUT_CHARS - 1)}…`
}

/** Shared rules for every grid “property” mode (no per-type branching inside the string). */
function propertyPromptSharedInstructions(): string {
  return `The summary should:
1. Be no longer than 130 characters
2. Capture the most important points
3. Be written in a clear, professional style
4. Avoid redundant information
5. Use **bold** for numbers, amounts, durations, or other quantitative details when they matter.

Include a separate “data” text only when it adds value: one tight line with the single most important quantitative or concrete figure from the context. If nothing quantitative fits, keep the data field short or empty.

Write in the same language as the context. Use markdown where helpful.

The API expects two fields: a concise summary and that optional data line.`
}

function wrapPropertyPrompt(text: string, taskParagraph: string): string {
  return `Context:\n${text}\n\nYou are a research assistant specializing in climate change adaptation.\n\n${taskParagraph}\n\n${propertyPromptSharedInstructions()}`
}

function propertyPromptCostBenefit(text: string): string {
  return wrapPropertyPrompt(
    text,
    `Focus on **costs and benefits** (who pays, who gains, trade-offs). In the data field, surface the strongest **cost and/or benefit** amounts, ranges, or monetised figures mentioned.`
  )
}

function propertyPromptImplementationTime(text: string): string {
  return wrapPropertyPrompt(
    text,
    `Focus on **implementation timing**: phases, milestones, start/end dates, durations, or how long activities took. In the data field, put the clearest **timeline figure** (e.g. years, months, or a dated span).`
  )
}

function propertyPromptLifetime(text: string): string {
  return wrapPropertyPrompt(
    text,
    `Focus on **lifetime, durability, or how long effects last** (project lifespan, maintenance horizon, long-term performance). In the data field, highlight the most salient **duration or longevity** figure.`
  )
}

function propertyPromptStakeholderParticipation(text: string): string {
  return wrapPropertyPrompt(
    text,
    `Focus on **who was involved** (actors, institutions, communities, governance) and **how they participated**. In the data field, prefer one concrete figure if present (e.g. number of participants, partners, consultations); otherwise a short named highlight.`
  )
}

function propertyPromptSuccessLimitations(text: string): string {
  return wrapPropertyPrompt(
    text,
    `Focus on **results, successes, and limitations** (what worked, what constrained delivery). In the data field, pick the **single most important quantitative outcome or limiting factor** and present it in bold if numeric.`
  )
}

function propertyPromptGeneric(property: string, text: string): string {
  return wrapPropertyPrompt(
    text,
    `Analyze the excerpt for the aspect labelled “${property}” in the app. Extract the essentials for comparison across case studies. In the data field, include the strongest concrete or quantitative detail, if any.`
  )
}

const PROPERTY_PROMPT_BUILDERS: Record<
  string,
  (text: string) => string
> = {
  cost_benefit: propertyPromptCostBenefit,
  implementation_time: propertyPromptImplementationTime,
  lifetime: propertyPromptLifetime,
  stakeholder_participation: propertyPromptStakeholderParticipation,
  success_limitations: propertyPromptSuccessLimitations,
}

function buildPropertyPrompt(property: string, text: string): string {
  const builder = PROPERTY_PROMPT_BUILDERS[property]
  if (builder) return builder(text)
  return propertyPromptGeneric(property, text)
}

function buildCustomPrompt(userPrompt: string, text: string): string {
  return `Context (one case study, excerpt only):\n${text}\n\n
User question (answer using ONLY the context above; if the context does not contain the answer, say so briefly):
${userPrompt}

You are a research assistant specializing in climate change adaptation.
Respond in the same language as the context when possible.

The answer should:
1. Be no longer than 130-150 characters for the main explanation
2. Highlight the most important keywords and any numeric figures (use **bold** for figures and key terms)
3. Avoid information not supported by the context

Provide output in this structured format:
- A concise summary text (the comparison answer)
- A data text: the single most important numeric or quantitative figure mentioned in your answer, or empty if none exists
`
}

export async function runSummarizePropertyItem(params: {
  mode: 'property' | 'custom'
  text: string
  property?: string
  userPrompt?: string
  cacheId: string
}): Promise<{ response: PropertySummaryStructured; timestamp: string }> {
  const {
    mode,
    text: textRaw,
    property = '',
    userPrompt = '',
    cacheId,
  } = params
  const text = truncatePropertySummaryInput(textRaw)

  if (!text) {
    throw new Error('Missing or empty required field: text')
  }
  if (mode === 'property' && !property) {
    throw new Error('Missing required field: property (for mode property)')
  }
  if (mode === 'custom' && !userPrompt.trim()) {
    throw new Error('Missing or empty required field: userPrompt (for mode custom)')
  }

  if (cacheId && propertySummaryCache.has(cacheId)) {
    return propertySummaryCache.get(cacheId)!
  }

  const fullPrompt =
    mode === 'custom'
      ? buildCustomPrompt(userPrompt.trim(), text)
      : buildPropertyPrompt(property, text)

  const { output: object } = await generateText({
    model: google('gemini-3.1-flash-lite-preview'),
    prompt: fullPrompt,
    output: Output.object({ schema: summarySchema }),
  })

  if (!object) {
    throw new Error('Model did not return structured summary output')
  }

  const response = {
    response: object,
    timestamp: new Date().toISOString(),
  }

  if (cacheId) {
    propertySummaryCache.set(cacheId, response)
  }

  return response
}

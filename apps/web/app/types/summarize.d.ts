export type SummarizePropertyMode = "property" | "custom"

export interface SummarizePropertyRequestBody {
  text: string
  mode?: SummarizePropertyMode
  property?: string
  userPrompt?: string
  cacheId: string
  locale?: string
}

export interface SummarizePropertyStructured {
  summary: string
  data: string
}

export interface SummarizePropertyResponseBody {
  response: SummarizePropertyStructured
  timestamp: string
}

export type SummarizePropertyBatchResult =
  | {
      id: string
      cacheId: string
      ok: true
      response: SummarizePropertyStructured
      timestamp: string
    }
  | {
      id: string
      cacheId: string
      ok: false
      error: string
    }

export interface SummarizePropertyBatchResponseBody {
  results: SummarizePropertyBatchResult[]
}

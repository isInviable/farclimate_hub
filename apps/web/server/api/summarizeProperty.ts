import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// Simple in-memory cache
const responseCache = new Map<string, { response: any; timestamp: string }>();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { text, property, cacheId } = body;

    if (!text || !property) {
      throw createError({
        statusCode: 400,
        message: "Missing required fields: text and property",
      });
    }

    // Check if we have a cached response
    if (cacheId && responseCache.has(cacheId)) {
      console.log("Returning cached response");
      return responseCache.get(cacheId);
    }

    const fullPrompt = `Context:\n${text}\n\n
    You are a research assistant specializing in climate change adaptation.
    Your task is to analyze the provided ${property} text and create a concise summary.
    The summary should:
    1. Be no longer than 2 sentences
    2. Capture the most important points
    3. Be written in a clear, professional style
    4. Avoid redundant information
    5. In case there is any type of data, make it bold.

    Evaluate if it makes sense to include a data text. In case there is a low probability of the data being relevant, do not include it.

    if the property is cost_benefit, the data should be the cost and benefit.
    if the property is implementation_time, the data should be the implementation time.
    if the property is lifetime, the data should be the lifetime.
    if the property is stakeholder_participation or success_limitations, 
    make a decision about the most important data figure and make it bold. 

    
    The summary should be in the same language as the text.

    Include markdown formatting.
    
    Add bold typography to the most important points.

    Please provide the summary in a structured format with:
    - A short title (3-5 words)
    - A concise summary text
    - A data text containing the single most important data figure in the property if it exists.
    `;

    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      prompt: fullPrompt,
      schema: z.object({
        title: z.string(),
        summary: z.string(),
        data: z.string(),
      }),
    });

    const response = {
      response: object,
      timestamp: new Date().toISOString(),
    };

    // Cache the response if we have a cacheId
    if (cacheId) {
      responseCache.set(cacheId, response);
    }

    return response;
  } catch (error) {
    console.error("Error in AI response:", error);
    throw createError({
      statusCode: 500,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate property summary",
    });
  }
}); 
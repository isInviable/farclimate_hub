import { generateObject } from "ai";
import { z } from "zod";
import { googleGenerativeModel } from "../utils/llmModelConfig";

// Simple in-memory cache
const responseCache = new Map<string, { response: any; timestamp: string }>();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { text, cacheId } = body;

    if (!text) {
      throw createError({
        statusCode: 400,
        message: "Missing required field: text",
      });
    }

    // Check if we have a cached response
    if (cacheId && responseCache.has(cacheId)) {
      console.log("Returning cached response");
      return responseCache.get(cacheId);
    }

    const fullPrompt = 
    `Text Document:\n${text}\n\n
    You are a research assistant for a specialist in climate change adaptation.
    Your task is to analyze the provided text document and extract key information.
    Please provide a summary of the document structured in a list of  core ideas. 
    The amount of core ideas should be between 2 and 6.
    
    Focus on extracting information related to climate change adaptation and its applications.
    Each item should be relevant to technical staff working in climate change adaptation.

    Returned text is Markdown, so you can include Markdown marks in the response. Explicitly include markdown marks for the main words within the list, not necessarily the first word.
    `;

    const config = useRuntimeConfig();
    const { object } = await generateObject({
      model: googleGenerativeModel(config),
      prompt: fullPrompt,
      output: "array",
      schema: z.string()
      
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
    console.error("Error in text analysis:", error);
    throw createError({
      statusCode: 500,
      message:
        error instanceof Error
          ? error.message
          : "Failed to analyze text document",
    });
  }
}); 
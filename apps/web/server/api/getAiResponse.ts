import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// Simple in-memory cache
const responseCache = new Map<string, { response: any; timestamp: string }>();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { documents, prompt, cacheId } = body;

    if (!documents || !Array.isArray(documents) || !prompt) {
      throw createError({
        statusCode: 400,
        message: "Missing required fields: documents and prompt",
      });
    }

    if (documents.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Documents array cannot be empty",
      });
    }

    // Check if we have a cached response
    console.log(cacheId)
    if (cacheId && responseCache.has(cacheId)) {
      console.log("Returning cached response");
      return responseCache.get(cacheId);
    }
    
    const context = documents
      .map((doc, index) => `Document ${index + 1}:\n${doc}`)
      .join("\n\n");

    const fullPrompt = `Context:\n${context}\n\n
    Question: 
    ${prompt}\n\ You are a research assistant for a specialist in climate change adaptation.
    Your users are a group of middle-level technical staff working in the field of climate change adaptation.
    You need to provide a summary of the documents and papers in the context provided.
    The summary must contain between 3 a 10 core ideas that you consider the most important within the context of the documents.
    So please, do not include ideas that are not related to climate change adaptation and how it can be applied to the industry/sector.
    Do not include more than 10 core ideas in the list. 
    The minimum number of core ideas is 3.
    To ellaborate the summary consider that the technical staff are trying to find solutions to climate adaptation problems in their own industry. 
    Each core idea has a title and a description.
    In the title do not include references to specific projects, core ideas should capture the meaning of the idea. In the description you can make reference to in which project or place it has been applied ( not necessary).
    Ideas' title should be a short sentence that captures the core idea of the document.
    Ideas' description should be around paragraph length and describes the core idea in more detail.
    The related articles should be the ids of the articles that are most related to the core ideas. I prefer to have a short list of related articles so include only the most relevant ones for that particular core idea. 
    Returned text in the descripton is Markdown, so you can include Markdown marks in the response. Explicitly include markdown marks for the main words within the list, not necessarily the first word.
    in the source text Articles id are identified by the string "articleId: " + id
    The response list of related articles should be an array of strings, each string is the id of an article.
    `;

    const { object } = await generateObject({
      model: google("gemini-3-flash-preview"),
      prompt: fullPrompt,
      output: "array",
      schema: z.object({
        title: z.string(),
        description: z.string(),
        relatedArticles: z.array(z.string()),
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
          : "Failed to generate AI response",
    });
  }
});

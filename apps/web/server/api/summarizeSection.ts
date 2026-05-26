import { generateObject } from "ai";
import { z } from "zod";
import { googleGenerativeModel } from "../utils/llmModelConfig";

// Simple in-memory cache
const sectionCache = new Map<string, { response: any; timestamp: string }>();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { text, section, cacheId } = body;

    if (!text || !section) {
      throw createError({
        statusCode: 400,
        message: "Missing required fields: text and section",
      });
    }

    // Check if we have a cached response
    if (cacheId && sectionCache.has(cacheId)) {
      console.log("Returning cached section summary");
      return sectionCache.get(cacheId);
    }

    let sectionPrompt = "";
    
    if (section === "who_is_involved") {
      sectionPrompt = `Context:\n${text}\n\n
      You are a research assistant specializing in climate change adaptation.
      Your task is to analyze the stakeholder participation text and create a concise summary.
      
      The summary should:
      1. Identify the 3 most important stakeholders or stakeholder groups
      2. For each stakeholder, provide a brief description (max 1 sentence)
      3. Focus on their role or contribution to the project
      4. Prioritize by importance and influence in the project
      5. Use clear, professional language
      
      Format the response as a structured list of exactly 3 items maximum.
      If there are fewer than 3 distinct stakeholders, include what's available.
      
      The summary should be in the same language as the text.`;
    } else if (section === "economic_data") {
      sectionPrompt = `Context:\n${text}\n\n
      You are a research assistant specializing in climate change adaptation.
      Your task is to analyze the economic data text and create a concise summary.
      
      The summary should:
      1. Identify the 3 most important economic aspects (costs, benefits, ROI, timeline, etc.)
      2. For each aspect, provide a brief description with specific figures when available
      3. Focus on quantifiable data and financial impacts
      4. Prioritize by relevance and clarity of the data
      5. Use clear, professional language and make numbers bold
      
      Format the response as a structured list of exactly 3 items maximum.
      If there are fewer than 3 distinct economic aspects, include what's available.
      
      The summary should be in the same language as the text.`;
    } else {
      throw createError({
        statusCode: 400,
        message: "Invalid section. Supported sections: who_is_involved, economic_data",
      });
    }

    const config = useRuntimeConfig();
    const { object } = await generateObject({
      model: googleGenerativeModel(config),
      prompt: sectionPrompt,
      schema: z.object({
        title: z.string().describe("A short title for the section (3-5 words)"),
        items: z.array(z.object({
          label: z.string().describe("Short label or category (2-4 words)"),
          description: z.string().describe("Brief description (max 1 sentence)")
        })).max(3).describe("Maximum 3 key items from the analysis"),
        summary: z.string().describe("One sentence overall summary of the section")
      }),
    });

    const response = {
      response: object,
      timestamp: new Date().toISOString(),
    };

    // Cache the response if we have a cacheId
    if (cacheId) {
      sectionCache.set(cacheId, response);
    }

    return response;
  } catch (error) {
    console.error("Error in AI section summary:", error);
    throw createError({
      statusCode: 500,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate section summary",
    });
  }
}); 
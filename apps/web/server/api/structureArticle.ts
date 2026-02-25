import { google } from "@ai-sdk/google";
import { generateText } from "ai";

// Simple in-memory cache
const structureCache = new Map();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { fulltext, language, documentId } = body;

    if (!fulltext || !language || !documentId) {
      throw createError({
        statusCode: 400,
        message: "Missing required fields: fulltext, language, and documentId",
      });
    }

    const cacheKey = `${documentId}-${language}`;
    if (structureCache.has(cacheKey)) {
      return structureCache.get(cacheKey);
    }

    const prompt = `You are an expert assistant in climate adaptation documentation. Your task is to re-structure the following article into the following sections, using only the information present in the original text. Do not invent or add new information. Rephrase and organize the content as needed. The output must be in ${language} and formatted in markdown. If a section is not present in the original, leave it empty or omit it.

**Formatting instructions:**
- Use clear section headers (## or ###) for each section and sub-section.
- Use **bold** for important concepts, numbers, and names.
- Use bullet points or numbered lists where appropriate.
- Add extra line breaks between sections for clarity.
- Make the markdown visually attractive and easy to scan.

Sections:

Context:
- Challenges
- Policy context
- Legal aspects
Objectives
Solution(s) implemented
Implementation phases and timeline
Success and limiting factors
Benefits
Lessons learnt
Transferability
SDGs

---

Original article:
${fulltext}

---

Return only the structured markdown, nothing else.`;

    const { text } = await generateText({
      model: google("gemini-3-flash-preview"),
      prompt,
    });

    const result = { markdown: text };
    structureCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error in structureArticle:", error);
    throw createError({
      statusCode: 500,
      message:
        error instanceof Error
          ? error.message
          : "Failed to structure article",
    });
  }
}); 
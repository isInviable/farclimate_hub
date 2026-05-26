import { generateObject } from "ai";
import { z } from "zod";
import type { ChatCatalogEntry, ChatCitation } from "../../app/types/chat";
import { filterCitationsToCatalog } from "./chatCatalog";
import { googleGenerativeModel } from "./llmModelConfig";

const citationsSchema = z.object({
  citedArticleIds: z.array(z.string()),
});

export function buildCitationExtractionPrompt(options: {
  userQuestion: string;
  assistantText: string;
  catalog: ChatCatalogEntry[];
}): string {
  const catalogLines = options.catalog
    .map((e) => `- articleId: ${e.articleId} | title: ${e.title}`)
    .join("\n");

  return `You identify which knowledge documents were used to produce an assistant answer.

The assistant was given a fixed catalog of documents. Return ONLY articleId values from the catalog that the assistant answer actually relied on. Do not invent ids. If the answer is generic or does not rely on specific documents, return an empty array.

Catalog:
${catalogLines}

User question:
${options.userQuestion}

Assistant answer:
${options.assistantText}`;
}

export async function extractChatCitations(options: {
  userQuestion: string;
  assistantText: string;
  catalog: ChatCatalogEntry[];
  runtimeConfig: Record<string, unknown>;
}): Promise<ChatCitation[]> {
  const { userQuestion, assistantText, catalog, runtimeConfig } = options;
  if (!catalog.length || !assistantText.trim()) return [];

  const { object } = await generateObject({
    model: googleGenerativeModel(runtimeConfig),
    prompt: buildCitationExtractionPrompt({
      userQuestion,
      assistantText,
      catalog,
    }),
    schema: citationsSchema,
  });

  return filterCitationsToCatalog(object.citedArticleIds, catalog);
}

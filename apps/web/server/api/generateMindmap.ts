import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { documents, prompt } = body || {};

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      throw createError({ statusCode: 400, message: "'documents' must be a non-empty array" });
    }

    const context = documents
      .map((doc: string, index: number) => `Document ${index + 1}:\n${doc}`)
      .join("\n\n");

    const defaultPrompt = `You are generating a Markmap mind map (markdown → mind map).\n\n` +
      `STRICT OUTPUT REQUIREMENTS:\n` +
      `- Output ONLY markdown headings. No prose, no bullet points, no code fences, no instructions, no separators.\n` +
      `- The first line MUST be '# mindmap'.\n` +
      `- Use only '#' levels for hierarchy: '##', '###', '####', ...\n` +
      `- Each heading is a short key idea (2-6 words), derived EXCLUSIVELY from the provided documents. Do NOT invent topics.\n` +
      `- Group related ideas under meaningful parents; avoid duplication.\n` +
      `- When a node primarily summarizes or aggregates a small set of documents, the node should be a markdown link with this structure [view](url) being an url a '?id=' symbols + the articleId. For example: [view](?id=1256).\n` +
      `- Do NOT include any other text beyond headings.\n\n` +
      `GOAL:\n` +
      `Create a concise, nested hierarchy of ONLY the key ideas present in the documents.\n\n` +
      `DOCUMENTS (each contains 'articleId: <id>'):\n${context}`;

    const { text } = await generateText({
      model: google("gemini-3.1-flash-lite-preview"),
      prompt:  defaultPrompt,
      maxTokens: 1200,
      temperature: 0.4,
    });

    // Best-effort sanitize: ensure it starts with '# markmap'
    const cleaned = (() => {
      const t = String(text || "").trim();
      if (t.startsWith("# mindmap")) return t;
      return `# mindmap\n\n${t.replace(/^#+\s*/,'')}`;
    })();

    return { markdown: cleaned, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("generateMindmap error", error);
    throw createError({ statusCode: 500, message: error instanceof Error ? error.message : 'Failed to generate mindmap' });
  }
});



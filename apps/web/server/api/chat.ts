import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { defineEventHandler, readBody } from "h3";

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    return { status: 405, body: "Method Not Allowed" };
  }

  const body = await readBody(event);
  const { messages, documents } = body;
  if (!messages || !Array.isArray(messages)) {
    return { status: 400, body: "Missing or invalid 'messages' array" };
  }

  // Compose the context from documents, if provided
  let context = '';
  if (documents && Array.isArray(documents) && documents.length > 0) {
    context = documents.join('\n');
  }
  

  // Compose the system prompt for the assistant
  let system =
    "You are a helpful assistant specialized in climate change adaptation.\
    Your responses should be in the same language as the question.\
    The responses are about the documents provided in the context. \
    We do not want to answer questions that are not related to the documents provided in the context. \
    If the question is not related to the documents provided in the context, answer that you do not know the answer. \
    If the question is related to the documents provided in the context, answer as helpfully and concisely as possible, using clear language for technical staff. \
     Answer as helpfully and concisely as possible, using clear language for technical staff.";
  if (context) {
    system = `Context:\n${context}\n\n${system}`;
  }

  // Stream the response from Gemini
  const result = streamText({
    model: google("gemini-3-flash-preview"),
    system,
    messages,
  });

  // Return the streamed response as a data stream
  return result.toDataStreamResponse();
}); 
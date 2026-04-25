import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  smoothStream,
  streamText,
  type UIMessage,
} from "ai";
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

  let context = "";
  if (documents && Array.isArray(documents) && documents.length > 0) {
    context = documents.join("\n");
  }

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

  const modelMessages = await convertToModelMessages(messages as UIMessage[]);

  const result = streamText({
    model: google("gemini-3.1-flash-lite-preview"),
    system,
    messages: modelMessages,
    // Re-chunk provider output so the UI updates in smaller steps (word ≈ ChatGPT-like; use "line" for newline-based chunks).
    experimental_transform: smoothStream({ chunking: "word" }),
  });

  return result.toUIMessageStreamResponse({
    onError: (err) => {
      if (err == null) return "An error occurred.";
      if (typeof err === "string") return err;
      if (err instanceof Error) return err.message;
      return "An error occurred.";
    },
  });
});

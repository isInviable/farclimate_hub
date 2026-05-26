import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  streamText,
  type UIMessage,
} from "ai";
import { defineEventHandler, readBody } from "h3";
import {
  getLastUserMessageText,
  normalizeCatalog,
  parseChatMode,
} from "../utils/chatCatalog";
import { extractChatCitations } from "../utils/chatCitations";
import { googleGenerativeModel } from "../utils/llmModelConfig";

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    return { status: 405, body: "Method Not Allowed" };
  }

  const body = await readBody(event);
  const { messages, documents } = body;
  if (!messages || !Array.isArray(messages)) {
    return { status: 400, body: "Missing or invalid 'messages' array" };
  }

  const mode = parseChatMode(body.mode);
  const catalog = normalizeCatalog(body.catalog);

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
  const userQuestion = getLastUserMessageText(messages);
  const config = useRuntimeConfig();

  const stream = createUIMessageStream({
    originalMessages: messages as UIMessage[],
    execute: async ({ writer }) => {
      const result = streamText({
        model: googleGenerativeModel(config),
        system,
        messages: modelMessages,
        experimental_transform: smoothStream({ chunking: "word" }),
      });

      const uiStream = result.toUIMessageStream({ sendFinish: false });
      const reader = uiStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          writer.write(value);
        }
      } finally {
        reader.releaseLock();
      }

      const assistantText = await result.text;

      if (mode === "corpus" && catalog.length > 0 && assistantText.trim()) {
        try {
          const citations = await extractChatCitations({
            userQuestion,
            assistantText,
            catalog,
            runtimeConfig: config,
          });
          writer.write({
            type: "data-citations",
            id: "citations",
            data: { citations },
          });
        } catch (err) {
          console.warn("[chat] citation extraction failed", err);
          writer.write({
            type: "data-citations",
            id: "citations",
            data: { citations: [] },
          });
        }
      }

      writer.write({ type: "finish", finishReason: "stop" });
    },
  });

  return createUIMessageStreamResponse({
    stream,
    onError: (err) => {
      if (err == null) return "An error occurred.";
      if (typeof err === "string") return err;
      if (err instanceof Error) return err.message;
      return "An error occurred.";
    },
  });
});

import type { UIMessage } from "ai";
import type { ChatCitation, ChatCitationsDataPart, ChatMode } from "~/types/chat";

export interface SerializedChatMessage {
  id?: string;
  role: string;
  text: string;
}

export function getTextPartsFromMessage(message: UIMessage): string {
  const parts = message.parts ?? [];
  return parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        p.type === "text" && typeof p.text === "string",
    )
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n");
}

export function serializeChatMessages(
  messages: UIMessage[],
): SerializedChatMessage[] {
  return messages
    .map((m) => ({
      id: m.id,
      role: m.role,
      text: getTextPartsFromMessage(m),
    }))
    .filter((m) => m.text.length > 0);
}

export function citationsByMessageIdFromMessages(
  messages: UIMessage[],
): Record<string, ChatCitation[]> {
  const out: Record<string, ChatCitation[]> = {};
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const citationsPart = message.parts?.find(
      (p): p is { type: "data-citations"; data: ChatCitationsDataPart } =>
        p.type === "data-citations" &&
        !!p.data &&
        Array.isArray(p.data.citations),
    );
    if (citationsPart?.data.citations.length) {
      out[message.id] = citationsPart.data.citations;
    }
  }
  return out;
}

export function buildConversationPinData(options: {
  messages: UIMessage[];
  mode: ChatMode;
}): Record<string, unknown> {
  const serialized = serializeChatMessages(options.messages);
  const citationsByMessageId = citationsByMessageIdFromMessages(
    options.messages,
  );
  const data: Record<string, unknown> = {
    messages: serialized,
    sourceView: "chat",
    mode: options.mode,
  };
  if (Object.keys(citationsByMessageId).length > 0) {
    data.citationsByMessageId = citationsByMessageId;
  }
  return data;
}

export function conversationPinTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const text = firstUser ? getTextPartsFromMessage(firstUser) : "";
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed;
}

import type { UIMessage } from "ai";

export type ChatMode = "single" | "corpus";

export interface ChatCatalogEntry {
  articleId: string;
  documentUid: string;
  title: string;
}

export interface ChatCitation {
  articleId: string;
  documentUid: string;
  title: string;
}

export interface ChatCitationsDataPart {
  citations: ChatCitation[];
}

export type ExplorerChatUIMessage = UIMessage<
  unknown,
  {
    citations: ChatCitationsDataPart;
  }
>;

export interface ChatApiRequestBody {
  messages: UIMessage[];
  mode?: ChatMode;
  catalog?: ChatCatalogEntry[];
  /** Legacy concatenated document blobs for model context. */
  documents?: string[];
}

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  role: "user" | "assistant";
  content: string | ChatContentPart[];
  model?: string;
  id?: string;
  createdAt?: string;
};

export type ChatSessionSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  model?: string;
};

export type ChatSession = ChatSessionSummary & {
  version: number;
  messages: ChatMessage[];
};

export type OpenRouterModel = {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
    modality?: string;
  };
};

export type ModelCategory = "all" | "free" | "paid";

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: ToolCall[];
    };
  }>;
  error?: {
    message?: string;
    code?: number;
    metadata?: { raw?: string };
  };
  data?: OpenRouterModel[];
};

export type ProxyResponse = {
  status: number;
  body: OpenRouterResponse;
};

export const API_KEY_STORAGE = "yolnoma.openrouter.api-key";
export const CHAT_STORAGE = "yolnoma.ai-chat.messages";

export const DEFAULT_MODELS: OpenRouterModel[] = [
  { id: "google/gemma-3-27b-it", name: "Gemma 3 27B IT" },
  { id: "laguna-s-2.1", name: "Poolside: Laguna S 2.1" },
];

import { apiRequest } from "./queryClient";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
// Do not change this unless explicitly requested by the user.
// Import the Google models
import { AI_MODELS as GOOGLE_MODELS } from "./googleai";

export const AI_MODELS = {
  OPENAI: [
    { id: "gpt-4o", name: "GPT-4o", provider: "openai", icon: "openai" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai", icon: "openai" },
  ],
  GOOGLE: GOOGLE_MODELS.GOOGLE,
  OTHER: [
    { id: "anthropic-claude", name: "Claude 3 Opus", provider: "anthropic", icon: "anthropic" },
    { id: "mistral", name: "Mistral Large", provider: "mistral", icon: "mistral" },
  ],
};

export const DEFAULT_MODEL = AI_MODELS.GOOGLE[0];

export type AIModel = {
  id: string;
  name: string;
  provider: string;
  icon: string;
};

export type AIModelParameters = {
  temperature: number;
  topP: number;
  maxTokens: number;
  responseFormat: "json" | "text" | "markdown";
  systemPrompt?: string;
};

export const DEFAULT_PARAMETERS: AIModelParameters = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  responseFormat: "text",
  systemPrompt: "You are a helpful coding assistant specializing in JavaScript, React, and cloud services like Firebase and Google Cloud.",
};

export type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: number;
};

export async function sendChatMessage(
  model: AIModel,
  messages: ChatMessage[],
  parameters: AIModelParameters,
) {
  const response = await apiRequest("POST", "/api/ai/chat", {
    model: model.id,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    parameters,
  });
  
  return await response.json();
}

export async function generateCode(
  model: AIModel,
  prompt: string,
  language: string,
  parameters: AIModelParameters,
) {
  const response = await apiRequest("POST", "/api/ai/generate-code", {
    model: model.id,
    prompt,
    language,
    parameters,
  });
  
  return await response.json();
}

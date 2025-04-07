import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ChatMessage } from "./openai";
import { withRetry, DEFAULT_RETRY_OPTIONS } from "./retry";

// Constants for Gemini model access
export const AI_MODELS = {
  GOOGLE: [
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      provider: "Google",
      icon: "google",
    },
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      provider: "Google",
      icon: "google",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "Google",
      icon: "google",
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      provider: "Google",
      icon: "google",
    },
    {
      id: "gemini-2.5-pro-preview",
      name: "Gemini 2.5 Pro Preview",
      provider: "Google",
      icon: "google",
    },
    {
      id: "imagen-3.0-generate",
      name: "Imagen 3",
      provider: "Google",
      icon: "google",
    },
  ],
};

// SafetySettings for Gemini models
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Mapping ChatMessage roles to Gemini roles
function mapRoles(message: ChatMessage) {
  switch (message.role) {
    case "assistant":
      return "model";
    case "system":
      return "user"; // Gemini doesn't have a system role, we'll prepend it as a user message
    default:
      return message.role;
  }
}

/**
 * Initialize the Google AI client with the provided API key
 */
export function initGoogleAI(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Send a chat message to the Gemini model
 */
export async function sendChatMessageGemini(
  modelId: string,
  messages: ChatMessage[],
  apiKey: string,
  parameters: {
    temperature: number;
    topP: number;
    maxTokens: number;
    systemPrompt?: string;
  }
) {
  try {
    const genAI = initGoogleAI(apiKey);
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: modelId });
    
    // Format messages for Gemini
    const chatHistory = [];
    
    // Handle system prompt separately since Gemini doesn't have a system role
    const systemMessages = messages.filter(m => m.role === "system");
    const nonSystemMessages = messages.filter(m => m.role !== "system");
    
    // Add system messages first (as user messages)
    if (systemMessages.length > 0 || parameters.systemPrompt) {
      let systemContent = parameters.systemPrompt || "";
      systemMessages.forEach(msg => {
        systemContent += (systemContent ? "\n\n" : "") + msg.content;
      });
      
      if (systemContent) {
        chatHistory.push({
          role: "user",
          parts: [{ text: `[System Instructions]\n${systemContent}\n[End System Instructions]` }],
        });
        
        // Add a model response to complete the turn
        chatHistory.push({
          role: "model",
          parts: [{ text: "I'll follow these instructions carefully." }],
        });
      }
    }
    
    // Add non-system messages
    nonSystemMessages.forEach(message => {
      chatHistory.push({
        role: mapRoles(message),
        parts: [{ text: message.content }],
      });
    });
    
    // Start the chat
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: parameters.temperature,
        topP: parameters.topP, 
        maxOutputTokens: parameters.maxTokens,
      },
      safetySettings,
    });
    
    // Send the message and get response
    const result = await chat.sendMessage("");
    
    const response = result.response;
    
    return {
      id: new Date().getTime().toString(),
      role: "assistant" as const,
      content: response.text(),
      timestamp: new Date().getTime(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred with Google AI';
      
    console.error("Error with Google AI:", error);
    return {
      id: new Date().getTime().toString(),
      role: "assistant" as const,
      content: `Error communicating with Google AI: ${errorMessage}`,
      timestamp: new Date().getTime(),
    };
  }
}

/**
 * Generate code with a Gemini model
 */
export async function generateCodeGemini(
  modelId: string, 
  prompt: string,
  language: string,
  apiKey: string,
  parameters: {
    temperature: number;
    topP: number;
    maxTokens: number;
    systemPrompt?: string;
  }
) {
  try {
    const genAI = initGoogleAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    
    // Create an appropriate prompt for code generation
    const codePrompt = `
${parameters.systemPrompt ? parameters.systemPrompt + "\n\n" : ""}
Generate code in ${language} for the following requirement:

${prompt}

Please provide only the code without explanations, comments are acceptable.
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: codePrompt }] }],
      generationConfig: {
        temperature: parameters.temperature,
        topP: parameters.topP,
        maxOutputTokens: parameters.maxTokens,
      },
      safetySettings,
    });
    
    const response = result.response;
    const text = response.text();
    
    // Extract code from response if it's wrapped in markdown code blocks
    const codeRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
    const match = text.match(codeRegex);
    
    return match ? match[1].trim() : text;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred with Google AI';
      
    console.error("Error generating code with Google AI:", error);
    return `// Error generating code: ${errorMessage}`;
  }
}
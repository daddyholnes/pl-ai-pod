import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertChatSchema, insertMessageSchema } from "@shared/schema";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendChatMessageGemini, generateCodeGemini } from "../client/src/lib/googleai";
import { ChatMessage } from "../client/src/lib/openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder-key-for-development",
});

// Initialize Google AI client
const googleApiKey = process.env.GOOGLE_API_KEY || "";
const googleAI = new GoogleGenerativeAI(googleApiKey);

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
// Do not change this unless explicitly requested by the user.

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const aiChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(messageSchema),
  parameters: z.object({
    temperature: z.number().min(0).max(1).default(0.7),
    topP: z.number().min(0).max(1).default(0.9),
    maxTokens: z.number().min(1).max(8192).default(2048),
    responseFormat: z.enum(["json", "text", "markdown"]).default("text"),
    systemPrompt: z.string().optional(),
  }),
});

const aiCodeRequestSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  language: z.string(),
  parameters: z.object({
    temperature: z.number().min(0).max(1).default(0.7),
    topP: z.number().min(0).max(1).default(0.9),
    maxTokens: z.number().min(1).max(8192).default(2048),
    responseFormat: z.enum(["json", "text", "markdown"]).default("text"),
    systemPrompt: z.string().optional(),
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // User Routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Chat Routes
  app.post("/api/chats", async (req: Request, res: Response) => {
    try {
      const validatedData = insertChatSchema.parse(req.body);
      const chat = await storage.createChat(validatedData);
      res.status(201).json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create chat" });
      }
    }
  });

  app.get("/api/users/:userId/chats", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const chats = await storage.getChatsByUserId(userId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chats" });
    }
  });

  // Message Routes
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  });

  app.get("/api/chats/:chatId/messages", async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const messages = await storage.getMessagesByChatId(chatId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // AI Chat Endpoint - now using Google Gemini models
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { model, messages, parameters } = aiChatRequestSchema.parse(req.body);
      
      // Convert messages to ChatMessage format with id and timestamp
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        id: Math.random().toString(36).substring(2, 15),
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
        timestamp: Date.now()
      }));
      
      // Use Gemini model (force gemini if not specified)
      const geminiModel = model.startsWith("gemini") ? model : "gemini-1.5-pro";
      
      try {
        const response = await sendChatMessageGemini(
          geminiModel,
          chatMessages,
          process.env.GOOGLE_API_KEY || "",
          {
            temperature: parameters.temperature,
            topP: parameters.topP,
            maxTokens: parameters.maxTokens,
            systemPrompt: parameters.systemPrompt
          }
        );
        
        res.json({
          message: response.content,
          model: geminiModel,
          provider: "google"
        });
        
      } catch (error) {
        console.error("Google AI API error:", error);
        throw error;
      }
    } catch (error) {
      console.error("AI API error:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ 
          message: "Error processing AI request",
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
  });

  // AI Code Generation Endpoint - using Google Gemini models
  app.post("/api/ai/generate-code", async (req: Request, res: Response) => {
    try {
      const { model, prompt, language, parameters } = aiCodeRequestSchema.parse(req.body);
      
      // Use Gemini model (force gemini if not specified)
      const geminiModel = model.startsWith("gemini") ? model : "gemini-1.5-pro";
      
      try {
        const code = await generateCodeGemini(
          geminiModel,
          prompt,
          language,
          process.env.GOOGLE_API_KEY || "",
          {
            temperature: parameters.temperature,
            topP: parameters.topP,
            maxTokens: parameters.maxTokens,
            systemPrompt: parameters.systemPrompt || `You are an expert ${language} developer. Generate well-structured, efficient, and properly formatted ${language} code.`
          }
        );
        
        res.json({
          code: code,
          model: geminiModel,
          provider: "google"
        });
      } catch (error) {
        console.error("Google AI code generation error:", error);
        throw error;
      }
    } catch (error) {
      console.error("AI code generation error:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ 
          message: "Error generating code",
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

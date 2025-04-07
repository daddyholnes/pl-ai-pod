import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Ensure you have your API Key securely configured (e.g., via VS Code settings or environment variables)
const API_KEY = vscode.workspace.getConfiguration('podplayPen').get<string>('geminiApiKey') || "YOUR_API_KEY"; // Replace with secure retrieval
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or specific model needed

const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};

const safetySettings = [
    // Configure safety settings as needed
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    // ... other categories
];

export async function getChatResponseFromGemini(prompt: string, history: any[]): Promise<string> {
    try {
        const chat = model.startChat({
            generationConfig,
            safetySettings,
            history: history.map(msg => ({ // Format history for the API
                role: msg.role,
                parts: [{ text: msg.content }]
            })),
        });

        const result = await chat.sendMessage(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to get response from Gemini API.");
    }
}

export async function getSummaryFromGemini(messagesToSummarize: any[]): Promise<string> {
     try {
        // Construct a prompt asking Gemini to summarize the conversation
        const conversationText = messagesToSummarize.map(msg => `[${msg.role}]: ${msg.content}`).join('\n');
        const prompt = `Please summarize the following conversation:\n\n${conversationText}\n\nSummary:`;

        const result = await model.generateContent(prompt); // Use generateContent for single-turn
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Summary API Error:", error);
        throw new Error("Failed to get summary from Gemini API.");
    }
}

// Add functions for code generation, suggestions etc. as needed

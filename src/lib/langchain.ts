import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Standard model for initial attempts
export const geminiModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-pro",
  maxOutputTokens: 2048,
  temperature: 0.3,
  streaming: false, // Disabled streaming for better stability with large summaries
  maxRetries: 3, // Add retries for reliability
  // timeout: 120000, // 2 minutes timeout for long transcripts
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
});

// Fallback model with more conservative settings
export const fallbackGeminiModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-pro",
  maxOutputTokens: 1024,
  temperature: 0.1, // Lower temperature for more conservative outputs
  streaming: false,
  maxRetries: 2,
  // timeout: 60000, // 1 minute timeout for fallback
  safetySettings: [
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
  ],
});

// Helper function to determine if error is due to safety filters
export const isSafetyError = (error: any): boolean => {
  return error.message?.includes('SAFETY') || 
         error.message?.includes('blocked') || 
         error.message?.includes('content policy');
};

// Helper function to check if error is due to token length
export const isTokenLengthError = (error: any): boolean => {
  return error.message?.includes('token') || 
         error.message?.includes('length') || 
         error.message?.includes('too long');
};
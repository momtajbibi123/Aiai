
import { GoogleGenAI } from "@google/genai";
import { GeminiResponse } from "../types";

export const getAIAnswer = async (
  prompt: string, 
  image?: { data: string; mimeType: string }
): Promise<GeminiResponse> => {
  try {
    // Re-initialize for every call to ensure we use the latest injected API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // For "quick seconds" response, gemini-3-flash-preview is best for text.
    // gemini-2.5-flash-image is best for vision/OCR tasks.
    const modelName = image ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';
    
    let response;
    
    if (image) {
      const imagePart = {
        inlineData: {
          mimeType: image.mimeType,
          data: image.data.split(',')[1],
        },
      };
      
      const textPart = { 
        text: prompt.trim() || "Analyze this image. If it contains a question, a math problem, or a diagram, solve it step-by-step. If it's a general image, describe it in detail." 
      };
      
      response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [imagePart, textPart] },
        config: {
          temperature: 0.4, // Lower temperature for more accurate/factual extraction
        }
      });
    } else {
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt.trim(),
        config: {
          systemInstruction: "You are a professional, high-speed AI assistant. Provide extremely accurate and clear answers. For math, use step-by-step logic. For general questions, be concise but thorough. Use Markdown for formatting.",
          temperature: 0.7,
        }
      });
    }

    if (!response || !response.text) {
      throw new Error("I couldn't generate an answer. Please try rephrasing your question.");
    }

    return { text: response.text };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMessage = "Connection error. Please try again.";
    
    if (error?.message?.includes("API key")) {
      errorMessage = "API Configuration issue. Please ensure your key is valid.";
    } else if (error?.message?.includes("quota")) {
      errorMessage = "Too many requests. Please wait a moment.";
    }
    
    return { 
      text: "", 
      error: errorMessage
    };
  }
};

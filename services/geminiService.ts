
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const polishText = async (text: string): Promise<string> => {
  try {
    // Added thinkingConfig to comply with guidelines for setting maxOutputTokens on Gemini 3 models
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Please polish the following text to be more elegant and suitable for handwriting on a notebook. Keep the meaning but improve flow: "${text}"`,
      config: {
        maxOutputTokens: 500,
        thinkingConfig: { thinkingBudget: 100 },
        temperature: 0.7,
      },
    });
    return response.text || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
};

export const summarizeToFit = async (text: string, lineCount: number): Promise<string> => {
  try {
    // Added thinkingConfig to comply with guidelines for setting maxOutputTokens on Gemini 3 models
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following text to fit exactly within approximately ${lineCount} lines of a B5 notebook. Maintain key information: "${text}"`,
      config: {
        maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 200 },
        temperature: 0.5,
      },
    });
    return response.text || text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return text;
  }
};

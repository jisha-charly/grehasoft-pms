
import { GoogleGenAI, Type } from "@google/genai";

// Always use named parameter for apiKey and obtain it exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeProjectStatus = async (projectData: any, tasks: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize this project status: ${JSON.stringify(projectData)}. Current tasks: ${JSON.stringify(tasks)}. Provide a concise executive summary in 3 bullet points.`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Status Error:", error);
    return "Unable to generate summary at this time.";
  }
};

export const suggestSEOKeywords = async (industry: string, targetRegion: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 10 high-intent SEO keywords for a ${industry} business in ${targetRegion}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING },
              volume: { type: Type.STRING },
              difficulty: { type: Type.NUMBER }
            },
            required: ["keyword", "volume", "difficulty"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI SEO Error:", error);
    return [];
  }
};

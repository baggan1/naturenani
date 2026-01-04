
import { GoogleGenAI, Chat, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../utils/constants";
import { searchVectorDatabase, logAnalyticsEvent } from "./backendService";
import { SearchSource, RemedyDocument, YogaPose, Message, Meal } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: { parts: [{ text }] }
    });
    const result = response.embeddings?.[0]?.values;
    return result || null;
  } catch (e) { 
    console.error("[GeminiService] Embedding failed:", e);
    return null; 
  }
};

const cleanHistory = (history: Message[]) => {
  const cleaned = history
    .filter(m => m.content && m.content.trim() !== '')
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const alternating: any[] = [];
  let lastRole = '';

  for (const msg of cleaned) {
    if (msg.role !== lastRole) {
      alternating.push(msg);
      lastRole = msg.role;
    }
  }
  return alternating;
};

export const sendMessageWithRAG = async function* (
  message: string, 
  history: Message[],
  userTier: 'Free' | 'Premium',
  queryCount: number,
  onSourcesFound?: (sources: RemedyDocument[]) => void
) {
  try {
    const ai = getAiClient();
    let contextDocs: RemedyDocument[] = [];
    let hasRAG = false;

    const queryVector = await generateEmbedding(message);
    if (queryVector) {
      contextDocs = await searchVectorDatabase(message, queryVector);
      if (onSourcesFound) onSourcesFound(contextDocs);
      hasRAG = contextDocs.length > 0;
    }

    const bookNamesArray = Array.from(new Set(
      contextDocs
        .map(doc => doc.book_name)
        .filter((name): name is string => !!name)
    ));

    // Fix: Use string concatenation to avoid backtick collisions in template literals
    const dynamicSystemInstruction = SYSTEM_INSTRUCTION + 
      "\n\nCURRENT SESSION CONTEXT:\nUser Tier: " + userTier + 
      "\nCurrent Query Count: " + queryCount;

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: 0.7,
      },
      history: cleanHistory(history)
    });

    const contextText = contextDocs.map(d => d.content).join('\n');
    const augmentedMessage = hasRAG 
      ? "Context for Wisdom Retrieval:\n" + contextText + "\n\nUser Consultation: " + message
      : message;

    const result = await chat.sendMessageStream({ message: augmentedMessage });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
    
    logAnalyticsEvent(
      message, 
      hasRAG ? 'RAG' : 'AI', 
      bookNamesArray.length > 0 ? bookNamesArray : ['General Knowledge']
    );
  } catch (error: any) { 
    console.error("[GeminiService] Chat stream error:", error);
    throw error; 
  }
};

export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  const ai = getAiClient();
  const prompt = "You are a yoga therapist. Recommend 3 specific yoga asanas AND 1 Pranayama (breathing exercise) for: \"" + ailmentId + "\". " + 
  "Return only a JSON list with the keys: 'pose_name', 'type' (either 'Asana' or 'Pranayama'), 'benefit', 'instructions' (detailed step-by-step), and 'contraindications'. " + 
  "Do not generate images. Provide deep therapeutic instructions.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pose_name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['Asana', 'Pranayama'] },
              benefit: { type: Type.STRING },
              instructions: { type: Type.STRING },
              contraindications: { type: Type.STRING }
            },
            required: ["pose_name", "type", "benefit", "instructions", "contraindications"]
          }
        }
      }
    });
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (e) { 
    console.error("[GeminiService] Yoga generation failed:", e);
    return []; 
  }
};

export const generateDietPlan = async (ailmentId: string): Promise<any> => {
  const ai = getAiClient();
  const prompt = "You are an expert nutritionist. Create a 3-day meal plan (Breakfast, Lunch, Dinner) for a user with " + ailmentId + ". " + 
  "Return only a JSON object with a \"meals\" array. Each meal should have: \"type\", \"dish_name\" (Standard culinary name), \"search_query\" (high quality photo of [dish_name] food), \"ingredients\" (array), \"benefit\", and \"preparation_instructions\" (step-by-step cooking or prep instructions). Do not generate images.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  dish_name: { type: Type.STRING },
                  search_query: { type: Type.STRING },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  benefit: { type: Type.STRING },
                  preparation_instructions: { type: Type.STRING }
                },
                required: ["type", "dish_name", "search_query", "ingredients", "benefit", "preparation_instructions"]
              }
            }
          }
        }
      }
    });
    const jsonStr = response.text || "{\"meals\": []}";
    return JSON.parse(jsonStr);
  } catch (e) { 
    console.error("[GeminiService] Diet plan generation failed:", e);
    return { meals: [] }; 
  }
};

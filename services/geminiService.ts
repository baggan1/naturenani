
import { GoogleGenAI, Chat, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, MAX_PROMPT_LENGTH } from "../utils/constants";
import { searchVectorDatabase, logAnalyticsEvent } from "./backendService";
import { RemedyDocument, Message, YogaPose, Meal, User } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates 768D embeddings for your Supabase documents_gemini table.
 */
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  const ai = getAiClient();
  try {
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: { parts: [{ text }] },
      config: { 
        outputDimensionality: 768 
      }
    });
    return result.embeddings?.[0]?.values || null;
  } catch (e) {
    console.error("[GeminiService] Embedding error:", e);
    return null;
  }
};

export const sendMessageWithRAG = async function* (
  message: string, 
  history: Message[],
  userTier: 'Free' | 'Premium',
  queryCount: number,
  currentUser: User | null,
  onSourcesFound?: (sources: RemedyDocument[]) => void
) {
  try {
    const safeMessage = message.substring(0, MAX_PROMPT_LENGTH);
    const ai = getAiClient();
    let contextDocs: RemedyDocument[] = [];
    let hasRAG = false;

    // 1. Vector Search for Agentic Handoff Grounding
    const queryVector = await generateEmbedding(safeMessage);
    if (queryVector) {
      contextDocs = await searchVectorDatabase(safeMessage, queryVector);
      if (contextDocs.length > 0) {
        if (onSourcesFound) onSourcesFound(contextDocs);
        hasRAG = true;
      }
    }

    // 2. Prepare Augmented Prompt with Clear Separation
    const contextText = contextDocs.length > 0 
      ? `ANCIENT TEXT CONTEXT (Prioritize this for the Botanical Rx detail):\n${contextDocs.map(d => `[Source: ${d.book_name}]\n${d.content}`).join('\n\n')}`
      : "The library is currently being re-indexed. Please provide a remedy based on your core knowledge of Ayurveda and Naturopathy.";

    const prompt = `
USER QUERY: ${safeMessage}

${contextText}

INSTRUCTION: 
1. Greet the user as Nature Nani.
2. Provide a holistic explanation and 3 quick home tips.
3. ALWAYS include the [METADATA_START] JSON block at the end with the 3 specialist modules populated. 
4. For Botanical Rx (REMEDY), provide a detailed Markdown table in the 'detail' field of the JSON.
    `;

    // 3. Streaming Response
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.65 // Slightly lower temperature for more grounded medical advice
      }
    });

    const result = await chat.sendMessageStream({ message: prompt });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }

    // 4. Log usage for Analytics
    if (currentUser) {
      logAnalyticsEvent(safeMessage, hasRAG ? 'RAG' : 'AI', contextDocs.map(d => d.book_name || 'Verified Tradition'));
    }
  } catch (error) {
    console.error("[GeminiService] Chat Error:", error);
    yield "My dear, I am having a moment of silence while I arrange my herbs. Please try once more.";
  }
};

export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: `Provide exactly 3 therapeutic yoga asanas for: ${ailmentId}. Return as JSON.` }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pose_name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["Asana", "Pranayama"] },
              benefit: { type: Type.STRING },
              instructions: { type: Type.STRING },
              contraindications: { type: Type.STRING }
            },
            required: ["pose_name", "type", "benefit", "instructions", "contraindications"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) { return []; }
};

export const generateDietPlan = async (ailmentId: string): Promise<{ meals: Meal[] }> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: `Generate a 3-day sattvic vegetarian diet plan for: ${ailmentId}. Return as JSON.` }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["Breakfast", "Lunch", "Dinner", "Snack"] },
                  dish_name: { type: Type.STRING },
                  search_query: { type: Type.STRING },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  benefit: { type: Type.STRING },
                  preparation_instructions: { type: Type.STRING }
                },
                required: ["type", "dish_name", "ingredients", "benefit"]
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"meals":[]}');
  } catch (e) { return { meals: [] }; }
};

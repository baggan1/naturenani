
import { GoogleGenAI, Chat, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, MAX_PROMPT_LENGTH } from "../utils/constants";
import { searchVectorDatabase, logAnalyticsEvent } from "./backendService";
import { RemedyDocument, Message, YogaPose, Meal, User } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates 768D embeddings using gemini-embedding-001.
 * Matches the Supabase schema dimension required for documents_gemini.
 */
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: { parts: [{ text }] },
      config: { 
        // LOCK TO 768 DIMENSIONS to match your Supabase vector(768) column
        outputDimensionality: 768 
      }
    });
    
    if (response.embeddings?.[0]?.values) {
      return response.embeddings[0].values;
    }
  } catch (e: any) {
    console.error(`[GeminiService] Embedding error:`, e?.message || e);
  }
  return null;
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

    // 1. Vector Search (RAG)
    try {
      const queryVector = await generateEmbedding(safeMessage);
      if (queryVector) {
        contextDocs = await searchVectorDatabase(safeMessage, queryVector);
        if (contextDocs.length > 0) {
          if (onSourcesFound) onSourcesFound(contextDocs);
          hasRAG = true;
        }
      }
    } catch (ragErr) {
      console.warn("[GeminiService] RAG retrieval skipped (likely re-indexing):", ragErr);
    }

    // 2. Prepare Augmented Prompt
    // If no context found (e.g. table is truncated), fallback gracefully
    const contextText = hasRAG 
      ? contextDocs.map(d => `[Source: ${d.book_name || 'Ancient Text'}]\n${d.content}`).join('\n\n')
      : "The ancient archives are currently being updated. Please provide a remedy based on your core Ayurvedic and Naturopathic training.";
    
    const augmentedMessage = `CONTEXT FROM ARCHIVES:\n${contextText}\n\nUSER CONSULTATION:\n${safeMessage}\n\nINSTRUCTION: If context is available, prioritize it. Use a warm, grandmotherly tone.`;

    // 3. Streaming Chat
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        temperature: 0.7 
      }
    });

    const result = await chat.sendMessageStream({ message: augmentedMessage });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
    
    // 4. Analytics
    if (currentUser) {
      logAnalyticsEvent(safeMessage, hasRAG ? 'RAG' : 'AI', contextDocs.map(d => d.book_name || 'Verified Source'));
    }
  } catch (error: any) { 
    console.error("[GeminiService] Consultation Error:", error);
    yield "My dear, I am having a moment of forgetfulness as I organize my scrolls. Please try once more.";
  }
};

export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  const ai = getAiClient();
  const prompt = `Recommend 3 therapeutic yoga asanas for: ${ailmentId}. Return JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pose_name: { type: Type.STRING },
              type: { type: Type.STRING },
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
  const prompt = `Provide a 3-day sattvic meal plan for: ${ailmentId}. Return JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
                required: ["type", "dish_name", "ingredients"]
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"meals": []}');
  } catch (e) { return { meals: [] }; }
};

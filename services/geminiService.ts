
import { GoogleGenAI, Chat, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, MAX_PROMPT_LENGTH } from "../utils/constants";
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
    return response.embeddings?.[0]?.values || null;
  } catch (e) { 
    return null; 
  }
};

/**
 * Ensures the conversation history is valid for the Gemini API:
 * 1. Alternates roles: user -> model -> user -> model
 * 2. Starts with a user turn (or merges turns until it does)
 * 3. Ends with a model turn (since the next turn will be the new user message)
 */
const cleanHistory = (history: Message[]) => {
  if (!history || history.length === 0) return [];

  // 1. Filter and Map to API format
  let raw = history
    .filter(m => m.content && m.content.trim() !== '' && m.id !== 'welcome')
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content.substring(0, MAX_PROMPT_LENGTH) }]
    }));

  if (raw.length === 0) return [];

  // 2. Enforce strict alternating roles
  const alternating: any[] = [];
  
  for (const msg of raw) {
    if (alternating.length === 0) {
      if (msg.role === 'user') {
        alternating.push(msg);
      }
      // If first message is 'model', we skip it to ensure we start with 'user'
      continue;
    }

    const last = alternating[alternating.length - 1];
    if (msg.role === last.role) {
      // Merge identical consecutive roles
      last.parts[0].text += "\n\n" + msg.parts[0].text;
    } else {
      alternating.push(msg);
    }
  }

  // 3. Ensure the history ends with 'model' so that chat.sendMessageStream(userText) is valid
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
    alternating.pop();
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
    const safeMessage = message.substring(0, MAX_PROMPT_LENGTH);
    const ai = getAiClient();
    let contextDocs: RemedyDocument[] = [];
    let hasRAG = false;

    // RAG Optimization: Reduced match_count for faster embedding/retrieval
    const queryVector = await generateEmbedding(safeMessage);
    if (queryVector) {
      contextDocs = await searchVectorDatabase(safeMessage, queryVector);
      if (onSourcesFound) onSourcesFound(contextDocs);
      hasRAG = contextDocs.length > 0;
    }

    const dynamicSystemInstruction = SYSTEM_INSTRUCTION + 
      "\n\nCURRENT SESSION CONTEXT:\nUser Tier: " + userTier + "\nConsultations Today: " + queryCount + "\nNote: If in 'Free' tier, strictly do not provide detailed dosages or protocols.";

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction: dynamicSystemInstruction, temperature: 0.7 },
      history: cleanHistory(history)
    });

    const contextText = contextDocs.map(d => d.content).join('\n');
    const augmentedMessage = hasRAG 
      ? "Wisdom Context (Verified Data):\n" + contextText + "\n\nUser Consultation Request:\n" + safeMessage
      : safeMessage;

    const result = await chat.sendMessageStream({ message: augmentedMessage });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
    
    logAnalyticsEvent(safeMessage, hasRAG ? 'RAG' : 'AI', contextDocs.map(d => d.book_name || 'Traditional Archive'));
  } catch (error: any) { 
    console.error("[GeminiService] Consultation failed:", error);
    yield "Namaste. It seems the archives are momentarily inaccessible. Please try a simpler request or refresh the connection.";
    throw error; 
  }
};

export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  const ai = getAiClient();
  const prompt = `Recommend 3 specific asanas and 1 pranayama for: ${ailmentId}. Return JSON list.`;
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

export const generateDietPlan = async (ailmentId: string): Promise<any> => {
  const ai = getAiClient();
  const prompt = `3-day meal plan for: ${ailmentId}. JSON only.`;
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
    return JSON.parse(response.text || "{\"meals\": []}");
  } catch (e) { return { meals: [] }; }
};

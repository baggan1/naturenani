
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
 * Ensures the conversation history is perfectly formatted for Gemini Chat:
 * 1. Must start with 'user'.
 * 2. Roles must strictly alternate: [user, model, user, model].
 * 3. Ends with 'model' (because the new message being sent will be 'user').
 */
const cleanHistory = (history: Message[]) => {
  if (!history || history.length === 0) return [];

  // Map to API structure first
  let raw = history
    .filter(m => m.content && m.content.trim() !== '' && m.id !== 'welcome')
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content.substring(0, MAX_PROMPT_LENGTH) }]
    }));

  if (raw.length === 0) return [];

  const alternating: any[] = [];
  
  for (const msg of raw) {
    if (alternating.length === 0) {
      // Rule 1: History MUST start with user
      if (msg.role === 'user') {
        alternating.push(msg);
      }
      continue;
    }

    const last = alternating[alternating.length - 1];
    if (msg.role === last.role) {
      // Rule 2: Merge same-role turns to preserve alternating sequence
      last.parts[0].text += "\n\n" + msg.parts[0].text;
    } else {
      alternating.push(msg);
    }
  }

  // Rule 3: chat.sendMessage requires the last turn in history to be MODEL
  // If it's USER, we remove it from history (it's effectively redundant context anyway)
  while (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
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

    // Optimization: Sequential embedding + retrieval
    const queryVector = await generateEmbedding(safeMessage);
    if (queryVector) {
      contextDocs = await searchVectorDatabase(safeMessage, queryVector);
      if (onSourcesFound) onSourcesFound(contextDocs);
      hasRAG = contextDocs.length > 0;
    }

    const dynamicSystemInstruction = SYSTEM_INSTRUCTION + 
      "\n\nCURRENT CONTEXT:\nTier: " + userTier + "\nToday's Consultations: " + queryCount;

    // Use a fresh chat session for every turn to ensure zero carry-over state issues
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction: dynamicSystemInstruction, temperature: 0.7 },
      history: cleanHistory(history)
    });

    const contextText = contextDocs.map(d => d.content).join('\n');
    const augmentedMessage = hasRAG 
      ? "Traditional Wisdom Context:\n" + contextText + "\n\nUser Consultation Request:\n" + safeMessage
      : safeMessage;

    const result = await chat.sendMessageStream({ message: augmentedMessage });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
    
    logAnalyticsEvent(safeMessage, hasRAG ? 'RAG' : 'AI', contextDocs.map(d => d.book_name || 'Verified Source'));
  } catch (error: any) { 
    console.error("[GeminiService] Consultation failed:", error);
    yield "I apologize, but my connection to the ancient wisdom archives was interrupted. Please try clicking 'New Consultation' to refresh our session.";
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

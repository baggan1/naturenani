
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
    console.warn("[GeminiService] Embedding failed:", e);
    return null; 
  }
};

const cleanHistory = (history: Message[]) => {
  if (!history || history.length === 0) return [];
  const recentHistory = history.slice(-10);
  let raw = recentHistory
    .filter(m => m.content && m.content.trim() !== '' && m.id !== 'welcome')
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content.substring(0, MAX_PROMPT_LENGTH) }]
    }));

  if (raw.length === 0) return [];
  const alternating: any[] = [];
  for (const msg of raw) {
    if (alternating.length === 0) {
      if (msg.role === 'user') alternating.push(msg);
      continue;
    }
    const last = alternating[alternating.length - 1];
    if (msg.role === last.role) {
      last.parts[0].text += "\n\n" + msg.parts[0].text;
    } else {
      alternating.push(msg);
    }
  }
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
    const isFirstTurn = history.length <= 1;

    if (!isFirstTurn) {
      try {
        const ragPromise = (async () => {
          const queryVector = await generateEmbedding(safeMessage);
          if (queryVector) return await searchVectorDatabase(safeMessage, queryVector);
          return [];
        })();
        const timeoutPromise = new Promise<RemedyDocument[]>((resolve) => setTimeout(() => resolve([]), 3500));
        contextDocs = await Promise.race([ragPromise, timeoutPromise]);
        if (contextDocs.length > 0) {
          if (onSourcesFound) onSourcesFound(contextDocs);
          hasRAG = true;
        }
      } catch (ragErr) {
        console.warn("[GeminiService] RAG retrieval failed:", ragErr);
      }
    }

    const dynamicSystemInstruction = SYSTEM_INSTRUCTION + 
      "\n\nCURRENT CONTEXT:\nTier: " + userTier + "\nToday's Consultations: " + queryCount;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: dynamicSystemInstruction, 
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      },
      history: cleanHistory(history)
    });

    // Added source citation info to the context string
    const contextText = contextDocs.map(d => `[SOURCE: ${d.book_name || 'Verified Text'}]\n${d.content}`).join('\n\n');
    const augmentedMessage = hasRAG 
      ? "Traditional Wisdom Context with Sources:\n" + contextText + "\n\nUser Request:\n" + safeMessage
      : safeMessage;

    const result = await chat.sendMessageStream({ message: augmentedMessage });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
    
    if (hasRAG) {
      logAnalyticsEvent(safeMessage, 'RAG', contextDocs.map(d => d.book_name || 'Verified Source'));
    } else {
      logAnalyticsEvent(safeMessage, 'AI', ['Gemini Knowledge Base']);
    }
  } catch (error: any) { 
    console.error("[GeminiService] Consultation failed:", error);
    yield "My dear, I am having a moment of forgetfulness. Let's try that again.";
    throw error; 
  }
};

export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  const ai = getAiClient();
  const prompt = `Recommend 3 specific asanas and 1 pranayama for: ${ailmentId}. Return JSON list.`;
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

export const generateDietPlan = async (ailmentId: string): Promise<any> => {
  const ai = getAiClient();
  const prompt = `3-day meal plan for: ${ailmentId}. JSON only.`;
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

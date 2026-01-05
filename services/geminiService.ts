
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

const cleanHistory = (history: Message[]) => {
  // 1. Filter and Truncate
  let cleaned = history
    .filter(m => m.content && m.content.trim() !== '' && m.id !== 'welcome')
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content.substring(0, MAX_PROMPT_LENGTH) }]
    }));

  // 2. Enforce Alternating Roles
  const alternating: any[] = [];
  let lastRole = '';

  for (const msg of cleaned) {
    if (msg.role !== lastRole) {
      alternating.push(msg);
      lastRole = msg.role;
    } else {
      // Append content to existing part if same role (Gemini requirement)
      alternating[alternating.length - 1].parts[0].text += "\n" + msg.parts[0].text;
    }
  }

  // 3. Final Validation: Gemini chat.sendMessage requires history to end with a MODEL turn.
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

    // Latency optimization: embedding call is sequential
    const queryVector = await generateEmbedding(safeMessage);
    if (queryVector) {
      contextDocs = await searchVectorDatabase(safeMessage, queryVector);
      if (onSourcesFound) onSourcesFound(contextDocs);
      hasRAG = contextDocs.length > 0;
    }

    const dynamicSystemInstruction = SYSTEM_INSTRUCTION + 
      "\n\nSESSION CONTEXT:\nTier: " + userTier + "\nConsultations Today: " + queryCount;

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: { systemInstruction: dynamicSystemInstruction, temperature: 0.7 },
      history: cleanHistory(history)
    });

    const contextText = contextDocs.map(d => d.content).join('\n');
    const augmentedMessage = hasRAG 
      ? "Wisdom Context:\n" + contextText + "\n\nUser Question:\n" + safeMessage
      : safeMessage;

    const result = await chat.sendMessageStream({ message: augmentedMessage });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
    
    logAnalyticsEvent(safeMessage, hasRAG ? 'RAG' : 'AI', contextDocs.map(d => d.book_name || 'Knowledge Base'));
  } catch (error: any) { 
    console.error("[GeminiService] Response failed:", error);
    yield "I apologize, but my connection to the ancient scrolls was interrupted. Please try a simpler follow-up or 'Reset Chat'.";
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

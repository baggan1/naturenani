
import { GoogleGenAI, Chat, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, MAX_PROMPT_LENGTH } from "../utils/constants";
import { searchVectorDatabase, logAnalyticsEvent } from "./backendService";
import { RemedyDocument, Message, YogaPose, Meal, User } from "../types";

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  const ai = getAiClient();
  try {
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: { parts: [{ text }] },
      config: { outputDimensionality: 768 }
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

    // 1. Vector Search
    const queryVector = await generateEmbedding(safeMessage);
    if (queryVector) {
      contextDocs = await searchVectorDatabase(safeMessage, queryVector);
      if (contextDocs.length > 0) {
        if (onSourcesFound) onSourcesFound(contextDocs);
        hasRAG = true;
      }
    }

    // 2. Build Intelligent Prompt
    const contextText = contextDocs.length > 0 
      ? `ANCIENT TEXT CONTEXT:\n${contextDocs.map(d => `[Source: ${d.book_name}]\n${d.content}`).join('\n\n')}`
      : "The library archives are updating. Use your internal Ayurvedic training.";

    const prompt = `
USER QUERY: ${safeMessage}

${contextText}

INSTRUCTIONS FOR NANI:
1. Check if the user mentioned their Age, Sex, and Health History in current message or chat history.
2. If NOT provided, warmly acknowledge their concern, explain why you need details, and ask using exactly this phrase: "Tell me your age, sex and any past medical history or other health concerns I should know about?"
3. Do NOT provide the full protocol or the [METADATA_START] block until you have these details.
4. If provided, give the holistic remedy and ALWAYS include the [METADATA_START] JSON block at the very end.
5. Ensure the JSON is valid and the 'detail' field contains a Markdown table.
    `;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5 // Lower temperature for more consistent JSON structure
      }
    });

    const result = await chat.sendMessageStream({ message: prompt });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }

    if (currentUser) {
      logAnalyticsEvent(safeMessage, hasRAG ? 'RAG' : 'AI', contextDocs.map(d => d.book_name || 'Tradition'));
    }
  } catch (error) {
    console.error("[GeminiService] Chat Error:", error);
    yield "My dear, Nani had a dizzy spell. Please repeat your words once more.";
  }
};

export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: `3 therapeutic yoga asanas for: ${ailmentId}. JSON format.` }] },
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
      contents: { parts: [{ text: `3-day sattvic diet plan for: ${ailmentId}. JSON format.` }] },
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

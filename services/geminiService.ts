
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
    const result = response.embeddings?.[0]?.values;
    return result || null;
  } catch (e) { 
    console.error("[GeminiService] Embedding failed:", e);
    return null; 
  }
};

const cleanHistory = (history: Message[]) => {
  // Filter out system messages or broken turns
  const cleaned = history
    .filter(m => m.content && m.content.trim() !== '' && m.id !== 'welcome')
    .map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content.substring(0, MAX_PROMPT_LENGTH) }]
    }));

  const alternating: any[] = [];
  let lastRole = '';

  for (const msg of cleaned) {
    if (msg.role !== lastRole) {
      alternating.push(msg);
      lastRole = msg.role;
    } else {
      // Append content to existing part if same role (Gemini requires alternating)
      alternating[alternating.length - 1].parts[0].text += "\n" + msg.parts[0].text;
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
    // Prevent massive prompts from hanging the system
    const safeMessage = message.substring(0, MAX_PROMPT_LENGTH);
    const ai = getAiClient();
    let contextDocs: RemedyDocument[] = [];
    let hasRAG = false;

    const queryVector = await generateEmbedding(safeMessage);
    if (queryVector) {
      contextDocs = await searchVectorDatabase(safeMessage, queryVector);
      if (onSourcesFound) onSourcesFound(contextDocs);
      hasRAG = contextDocs.length > 0;
    }

    const bookNamesArray = Array.from(new Set(
      contextDocs
        .map(doc => doc.book_name)
        .filter((name): name is string => !!name)
    ));

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
      ? "Context for Wisdom Retrieval:\n" + contextText + "\n\nUser Message: " + safeMessage
      : safeMessage;

    const result = await chat.sendMessageStream({ message: augmentedMessage });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
    
    logAnalyticsEvent(
      safeMessage, 
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
  "Return only a JSON list with the keys: 'pose_name', 'type' (either 'Asana' or 'Pranayama'), 'benefit', 'instructions', and 'contraindications'. " + 
  "Provide deep therapeutic instructions.";
  
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
  } catch (e) { 
    console.error("[GeminiService] Yoga generation failed:", e);
    return []; 
  }
};

export const generateDietPlan = async (ailmentId: string): Promise<any> => {
  const ai = getAiClient();
  const prompt = "Create a 3-day meal plan for: " + ailmentId + ". " + 
  "Return only a JSON object with a \"meals\" array. Keys: \"type\", \"dish_name\", \"search_query\", \"ingredients\", \"benefit\", \"preparation_instructions\".";

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
  } catch (e) { 
    console.error("[GeminiService] Diet plan generation failed:", e);
    return { meals: [] }; 
  }
};

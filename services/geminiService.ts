
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../utils/constants";
import { searchVectorDatabase, logAnalyticsEvent } from "./backendService";
import { SearchSource, RemedyDocument, YogaPose } from "../types";

let client: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

export const initializeGemini = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[Gemini] API_KEY is missing. Check your .env file.");
    return;
  }
  
  console.log(`[Gemini] Initializing...`);
  client = new GoogleGenAI({ apiKey });
};

export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  if (!client) initializeGemini();
  if (!client) return null;

  try {
    const response = await client.models.embedContent({
      model: 'text-embedding-004',
      contents: { parts: [{ text }] }
    });
    return response.embeddings?.[0]?.values || null;
  } catch (error) {
    console.error("[Gemini] Embedding Error:", error);
    return null;
  }
};

export const startChat = async () => {
  if (!client) initializeGemini();
  if (!client) throw new Error("Failed to initialize AI client. Missing API Key.");

  chatSession = client.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return chatSession;
};

export const sendMessageWithRAG = async function* (
  message: string, 
  onSourcesFound?: (sources: RemedyDocument[]) => void
) {
  try {
    if (!chatSession) await startChat();
    if (!chatSession) throw new Error("Chat session not initialized");

    console.log("[Gemini] RAG Start:", message);

    // 1. Get Embeddings (with increased timeout fallback)
    const embeddingPromise = generateEmbedding(message);
    const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 8000));
    const queryVector = await Promise.race([embeddingPromise, timeoutPromise]);
    
    // 2. Search Database
    const contextDocs = await searchVectorDatabase(message, queryVector);
    
    if (onSourcesFound) onSourcesFound(contextDocs);
    
    let augmentedMessage = message;
    const hasRAG = contextDocs.length > 0;

    if (hasRAG) {
      const contextString = contextDocs.map(d => {
        const sourceInfo = d.book_name ? `${d.source} (Book: ${d.book_name})` : d.source;
        return `[Source: ${sourceInfo}]: ${d.content}`;
      }).join('\n\n');

      augmentedMessage = `
Context Information:
${contextString}

User Query:
${message}
      `;
    }

    augmentedMessage += `\n\n[SYSTEM REMINDER]: If this query relates to a health condition where Yoga or Diet would be beneficial, you MUST append the JSON recommendation block at the very end as specified in your system instructions.`;

    console.log("[Gemini] Stream started using gemini-3-flash-preview...");
    
    const result = await chatSession.sendMessageStream({ message: augmentedMessage });
    
    let chunkCount = 0;
    // Standard for-await loop is more resilient than manual iterator + race
    for await (const chunk of result) {
      if (chunk.text) {
        chunkCount++;
        yield chunk.text;
      }
    }

    if (chunkCount === 0) {
      throw new Error("Received empty response from AI");
    }
    
    console.log("[Gemini] Stream finished.");
    logAnalyticsEvent(message, hasRAG ? 'RAG' : 'AI', `Docs: ${contextDocs.length}`);

  } catch (error) {
    console.error("[Gemini] Chat Error:", error);
    throw error;
  }
};

/**
 * Premium Feature: Generate Yoga Routine based on ID with RAG Support
 */
export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  if (!client) initializeGemini();
  if (!client) throw new Error("Client not initialized");

  console.log(`[Yoga] Generating routine for ${ailmentId} using gemini-3-flash-preview`);

  let contextString = "";
  try {
    const embedding = await generateEmbedding(ailmentId);
    if (embedding) {
      const docs = await searchVectorDatabase(ailmentId, embedding, 'Yoga');
      if (docs.length > 0) {
        contextString = "Use the following Yoga Database Context to inform your sequence:\n" + 
          docs.map(d => `- ${d.content}`).join("\n");
      }
    }
  } catch (e) {
    console.warn("[Yoga] RAG fetch failed", e);
  }

  const prompt = `
    The user has a condition ID or Query: "${ailmentId}".
    ${contextString}
    Generate a list of 3-5 specific Yoga poses to help this condition.
    Use standard Sanskrit names where possible.
    Provide detailed step-by-step instructions, breathing patterns, and repetitions.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              name: { type: Type.STRING },
              english: { type: Type.STRING },
              duration: { type: Type.STRING },
              benefit: { type: Type.STRING },
              color: { type: Type.STRING },
              instructions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              breathing: { type: Type.STRING },
              reps: { type: Type.STRING }
            },
            required: ["id", "name", "english", "duration", "benefit", "instructions", "breathing", "reps"]
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text) as YogaPose[];
    }
    return [];
  } catch (e) {
    console.error("Yoga Gen Error", e);
    return [];
  }
};

/**
 * Premium Feature: Generate Diet Plan based on ID with RAG Support
 */
export const generateDietPlan = async (ailmentId: string): Promise<any[]> => {
  if (!client) initializeGemini();
  if (!client) throw new Error("Client not initialized");

  console.log(`[Diet] Generating plan for ${ailmentId} using gemini-3-flash-preview`);

  let contextString = "";
  try {
    const embedding = await generateEmbedding(ailmentId);
    if (embedding) {
      const docs = await searchVectorDatabase(ailmentId, embedding, 'diet');
      if (docs.length > 0) {
        contextString = "Use the following Diet Database Context to inform your meal plan:\n" + 
          docs.map(d => `- ${d.content}`).join("\n");
      }
    }
  } catch (e) {
    console.warn("[Diet] RAG fetch failed", e);
  }

  const prompt = `
    The user has a condition ID: "${ailmentId}".
    ${contextString}
    Generate a 3-day Ayurvedic/Naturopathic meal plan.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    instructions: { type: Type.STRING },
                    image_keyword: { type: Type.STRING },
                    key_ingredient: { type: Type.STRING }
                  },
                  required: ["type", "name", "ingredients", "instructions", "image_keyword", "key_ingredient"]
                }
              }
            },
            required: ["day", "meals"]
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (e) {
    console.error("Diet Gen Error", e);
    return [];
  }
};

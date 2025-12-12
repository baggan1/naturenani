
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../utils/constants";
import { searchVectorDatabase, logAnalyticsEvent } from "./backendService";
import { SearchSource, RemedyDocument, YogaPose } from "../types";

let client: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

export const initializeGemini = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[Gemini] API_KEY is missing. Check your Vercel Environment Variables.");
    return;
  }
  
  console.log(`[Gemini] Initializing with Key: ${apiKey.substring(0, 4)}...`);
  
  client = new GoogleGenAI({ apiKey });
};

export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  if (!client) initializeGemini();
  if (!client) return null;

  try {
    // FIX: Use 'contents' (singular/plural property name in updated SDK) for embedding request
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
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      // tools: [{ googleSearch: {} }] // Disabled to prevent empty streams/latency
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

    const queryVector = await generateEmbedding(message);
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

    console.log("[Gemini] Stream started...");
    
    const result = await chatSession.sendMessageStream({ message: augmentedMessage });
    
    // Safety Timeout: If stream doesn't yield within 10 seconds, throw error
    const streamIterator = result[Symbol.asyncIterator]();
    let streamActive = true;
    let chunkCount = 0;

    while (streamActive) {
      const raceResult = await Promise.race([
        streamIterator.next(),
        new Promise<{ done: boolean, value: any }>((_, reject) => 
          setTimeout(() => reject(new Error("Stream timeout")), 10000)
        )
      ]);

      if (raceResult.done) {
        streamActive = false;
        break;
      }

      const chunk = raceResult.value;
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
 * Premium Feature: Generate Yoga Routine based on ID
 */
export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  if (!client) initializeGemini();
  if (!client) throw new Error("Client not initialized");

  const prompt = `
    The user has a condition ID: "${ailmentId}".
    Generate a list of 3-5 specific Yoga poses to help this condition.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
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
              color: { type: Type.STRING, description: "Tailwind CSS classes for color, e.g. bg-blue-100 text-blue-800" }
            },
            required: ["id", "name", "english", "duration", "benefit"]
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
 * Premium Feature: Generate Diet Plan based on ID
 */
export const generateDietPlan = async (ailmentId: string): Promise<any[]> => {
  if (!client) initializeGemini();
  if (!client) throw new Error("Client not initialized");

  const prompt = `
    The user has a condition ID: "${ailmentId}".
    Generate a 3-day Ayurvedic meal plan.
    For each day, provide Breakfast, Lunch, and Dinner.
    For each meal, provide:
    - name: The name of the dish
    - ingredients: A list of main ingredient strings
    - instructions: A short 1-sentence cooking instruction
    - image_keyword: A single english word to search for an image (e.g. "oatmeal", "soup", "salad")
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: prompt }] },
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, description: "Day 1, Day 2 etc" },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Breakfast, Lunch, or Dinner" },
                    name: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    instructions: { type: Type.STRING },
                    image_keyword: { type: Type.STRING }
                  },
                  required: ["type", "name", "ingredients", "instructions", "image_keyword"]
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

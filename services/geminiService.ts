
import { GoogleGenAI, Chat, Type, GenerateContentParameters } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../utils/constants";
import { searchVectorDatabase, logAnalyticsEvent } from "./backendService";
import { SearchSource, RemedyDocument, YogaPose, Message } from "../types";

/**
 * Creates a fresh instance of the GoogleGenAI client per request.
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: { parts: [{ text }] }
    });
    return response.embeddings?.[0]?.values || null;
  } catch (error) {
    console.error("[Gemini] Embedding Error:", error);
    return null;
  }
};

/**
 * Sends a message using RAG and maintains conversation history correctly.
 */
export const sendMessageWithRAG = async function* (
  message: string, 
  history: Message[],
  onSourcesFound?: (sources: RemedyDocument[]) => void
) {
  console.group("Nature Nani Consultation");
  
  try {
    const ai = getAiClient();

    // 1. Get Embeddings for RAG
    console.info("[Step 1] Generating Embeddings...");
    const embeddingPromise = generateEmbedding(message);
    const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 12000));
    const queryVector = await Promise.race([embeddingPromise, timeoutPromise]);
    
    // 2. Search Database
    console.info("[Step 2] Searching Vector Database...");
    const contextDocs = await searchVectorDatabase(message, queryVector);
    if (onSourcesFound) onSourcesFound(contextDocs);
    
    // 3. Prepare Augmented Message
    let augmentedMessage = message;
    const hasRAG = contextDocs.length > 0;

    if (hasRAG) {
      const contextString = contextDocs.map(d => {
        const sourceInfo = d.book_name ? `${d.source} (Book: ${d.book_name})` : d.source;
        return `[Source: ${sourceInfo}]: ${d.content}`;
      }).join('\n\n');

      augmentedMessage = `
Context Information from Ancient Texts:
${contextString}

User Query:
${message}
      `;
    }

    augmentedMessage += `\n\n[SYSTEM REMINDER]: If this query relates to a health condition where Yoga or Diet would be beneficial, you MUST append the JSON recommendation block at the very end as specified in your system instructions.`;

    // 4. Initialize Chat with VALID History (User/Model pairs only)
    // We filter out any empty messages or messages with roles other than user/model
    const sdkHistory = history
      .filter(msg => msg.content && msg.content.trim() !== '')
      .map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: sdkHistory
    });

    console.info("[Step 3] Starting AI Stream...");
    const result = await chat.sendMessageStream({ message: augmentedMessage });
    
    let chunkCount = 0;
    for await (const chunk of result) {
      if (chunk.text) {
        chunkCount++;
        yield chunk.text;
      }
    }

    if (chunkCount === 0) {
      throw new Error("AI stream returned no content.");
    }
    
    console.info("[Step 4] Consultation Complete.");
    logAnalyticsEvent(message, hasRAG ? 'RAG' : 'AI', `Docs: ${contextDocs.length}`);

  } catch (error: any) {
    console.error("[Gemini] Chat Error:", error);
    throw error;
  } finally {
    console.groupEnd();
  }
};

/**
 * Premium Feature: Generate Yoga Routine
 */
export const generateYogaRoutine = async (ailmentId: string): Promise<YogaPose[]> => {
  const ai = getAiClient();
  
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
 * Premium Feature: Generate Diet Plan
 */
export const generateDietPlan = async (ailmentId: string): Promise<any[]> => {
  const ai = getAiClient();

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

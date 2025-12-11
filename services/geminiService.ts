import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../utils/constants";
import { searchVectorDatabase, logAnalyticsEvent } from "./backendService";
import { SearchSource, RemedyDocument } from "../types";

let client: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

export const initializeGemini = () => {
  // Try getting key from standard process.env (injected via Vite config)
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[Gemini] API_KEY is missing. Check your Vercel Environment Variables.");
    return;
  }
  
  // Security Note: Don't log the full key in production, just the presence
  console.log(`[Gemini] Initializing with Key: ${apiKey.substring(0, 4)}...`);
  
  client = new GoogleGenAI({ apiKey });
};

/**
 * Generates a vector embedding for the user's query.
 * This is required to search your existing Supabase vector database.
 */
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  if (!client) initializeGemini();
  if (!client) return null;

  try {
    // We use the embedding model to convert text to vector
    const response = await client.models.embedContent({
      model: 'text-embedding-004',
      contents: {
        parts: [{ text }]
      }
    });
    
    // Check if embedding exists and return it
    return response.embeddings?.[0]?.values || null;
  } catch (error) {
    console.error("[Gemini] Embedding Error:", error);
    // Fallback for demo/mock mode if API fails or model not available
    return null;
  }
};

/**
 * Starts a new chat session with the model.
 */
export const startChat = async () => {
  if (!client) initializeGemini();
  
  if (!client) {
    throw new Error("Failed to initialize AI client. Missing API Key.");
  }

  chatSession = client.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      // Enable Google Search tool for Grounding
      tools: [{ googleSearch: {} }] 
    },
  });

  return chatSession;
};

/**
 * Sends a message to the model, implementing the RAG pattern:
 * 1. Generate embedding for user query.
 * 2. Retrieve relevant docs from Vector DB (Supabase) using that embedding.
 * 3. Append context to user prompt.
 * 4. Stream response.
 * 5. Track source (RAG vs Search) for analytics.
 */
export const sendMessageWithRAG = async function* (
  message: string, 
  onSourcesFound?: (sources: RemedyDocument[]) => void
) {
  try {
    if (!chatSession) {
      await startChat();
    }

    if (!chatSession) throw new Error("Chat session not initialized");

    // RAG STEP 1: Generate Embedding (Vector) for the question
    const queryVector = await generateEmbedding(message);

    // RAG STEP 2: Retrieval (Pass vector + text to backend)
    const contextDocs = await searchVectorDatabase(message, queryVector);
    
    // Callback to UI immediately
    if (onSourcesFound) {
      onSourcesFound(contextDocs);
    }
    
    // RAG STEP 3: Augmentation
    let augmentedMessage = message;
    const hasRAG = contextDocs.length > 0;

    if (hasRAG) {
      // Construct context with Book Name citation
      const contextString = contextDocs.map(d => {
        const sourceInfo = d.book_name ? `${d.source} (Book: ${d.book_name})` : d.source;
        return `[Source: ${sourceInfo}]: ${d.content}`;
      }).join('\n\n');

      augmentedMessage = `
Context Information (Use this to inform your answer if relevant, but do not explicitly mention 'the provided context' unless necessary):
${contextString}

User Query:
${message}
      `;
    }

    // RAG STEP 4: Generation (Streaming)
    let usedSearch = false;
    
    const result = await chatSession.sendMessageStream({ message: augmentedMessage });
    
    for await (const chunk of result) {
      // Check if Google Search Grounding was used in this chunk
      if (chunk.candidates?.[0]?.groundingMetadata?.searchEntryPoint) {
        usedSearch = true;
      }
      
      if (chunk.text) {
        yield chunk.text;
      }
    }
    
    // RAG STEP 5: Analytics Logging
    let source: SearchSource = 'AI';
    let details = '';
    
    if (hasRAG && usedSearch) {
      source = 'Hybrid';
      details = `Combined ${contextDocs.length} DB docs + Google Search`;
    } else if (hasRAG) {
      source = 'RAG';
      details = `Used ${contextDocs.length} DB documents`;
    } else if (usedSearch) {
      source = 'GoogleSearch';
      details = 'Triggered Web Grounding';
    } else {
      source = 'AI';
      details = 'Pure LLM Knowledge';
    }

    logAnalyticsEvent(message, source, details);

  } catch (error) {
    console.error("[Gemini] Chat Error:", error);
    throw error; // Propagate to UI
  }
};
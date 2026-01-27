# Nature Nani: Multi-Agent RAG Orchestration Engine

Nature Nani is a production-grade Generative AI platform that leverages **Google Gemini 3 Flash** and a high-performance **pgvector** backend. The system is designed for sub-250ms query latency using an asynchronous data orchestration layer and a proprietary "Feature Handoff" agentic logic.

## 🏗 System Architecture

The platform is built on a "Grounding-First" philosophy, ensuring that every LLM response is anchored in verified vector embeddings from ancient Ayurvedic and Naturopathic scriptures.

```mermaid
graph TD
    subgraph Client_Tier [Client Tier - React/Vite]
        UI[Nature Nani UI]
        Chat[Consultation Interface]
        Specialist[Feature Handoff Modules]
        Voice[Voice Mode - Gemini Live]
    end

    subgraph Intelligence_Tier [Intelligence Tier - Google AI]
        G3F[Gemini 3 Flash - Orchestrator]
        Embed[text-embedding-004]
        TTS[Gemini TTS - Nani's Voice]
    end

    subgraph Data_Tier [Data Tier - Supabase]
        Auth[Supabase Auth - OAuth/OTP]
        PGV[(pgvector Database)]
        HNSW[HNSW Indexing]
    end

    %% Interactions
    UI --> Auth
    Chat --> Embed
    Embed --> PGV
    PGV -- Similarity Search --> G3F
    Chat -- Prompt + Context --> G3F
    G3F -- JSON Schema --> Specialist
    G3F --> TTS
    Specialist -- Save Protocol --> PGV
```

## 🛠 Technical Deep Dive: pgvector Implementation

For our vector search, we moved beyond basic semantic search to focus on precision at scale.

### 1. Indexing Strategy: HNSW
To maintain sub-250ms latency as the dataset scales, we implemented **HNSW (Hierarchical Navigable Small World)** indexing on our Supabase instance.

### 2. The RAG Sequence
Every consultation follows a strict grounding sequence to prevent hallucinations.

```mermaid
sequenceDiagram
    participant User
    participant App as Nature Nani App
    participant DB as Supabase (pgvector)
    participant AI as Gemini 3 Flash

    User->>App: Submits Ailment (e.g., "Knee Pain")
    App->>App: Generate Embedding (text-embedding-004)
    App->>DB: Cosine Similarity Match (match_documents)
    DB-->>App: Returns Relevant Ayurvedic Verses
    App->>AI: System Prompt + History + RAG Context
    Note over AI: Agentic Reasoning & Root Cause Analysis
    AI-->>App: Structured Response + [METADATA_START] JSON
    App->>App: Validate Schema (Feature Handoff)
    App->>User: Render Nani's Advice + Specialty Cards
```

### 3. The "Feature Handoff" Logic
Nature Nani uses structured **Agentic Handoff** to transition from general consultation to specialized healing modules.

```mermaid
stateDiagram-v2
    [*] --> ConsultationInput
    ConsultationInput --> GeminiProcessing : Augment with RAG
    
    state GeminiProcessing {
        [*] --> Reasoning
        Reasoning --> OutputGeneration
    }

    OutputGeneration --> SchemaParser : Detect Metadata Marker
    
    state SchemaParser {
        [*] --> ValidateJSON
        ValidateJSON --> REMEDY : type is REMEDY
        ValidateJSON --> YOGA : type is YOGA
        ValidateJSON --> DIET : type is DIET
    }

    REMEDY --> BotanicalRx : Render Clinical Table
    YOGA --> YogaAid : Render Therapeutic Asanas
    DIET --> NutriHeal : Render Sattvic Meal Plan

    BotanicalRx --> Library : Save Action
    YogaAid --> Library : Save Action
    NutriHeal --> Library : Save Action
```

## 🥗 Nutri-Heal Philosophy
The engine is strictly configured for **Sattvic Nutrition**:
*   **Ayurvedic Purity:** Focus on light, life-promoting foods.
*   **Strict Restrictions:** Zero red meat or poultry; specialized legumes and whole grains only.

## 🚀 Performance Benchmarks
*   **Average Query Latency:** <240ms (End-to-End)
*   **Embedding Dimension:** 768 (Optimized for Gemini `text-embedding-004`)

---
*Disclaimer: Nature Nani is an AI-powered educational tool and not a substitute for professional medical advice.*
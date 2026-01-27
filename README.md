# Nature Nani: Multi-Agent RAG Orchestration Engine

Nature Nani is a production-grade Generative AI platform that leverages **Google Gemini 3 Flash** and a high-performance **pgvector** backend. The system is designed for sub-250ms query latency using an asynchronous data orchestration layer and a proprietary "Feature Handoff" agentic logic.

## 🏗 System Architecture

The platform is built on a "Grounding-First" philosophy, ensuring that every LLM response is anchored in verified vector embeddings from ancient Ayurvedic and Naturopathic scriptures.

### Key Technical Pillars:
*   **Model Serving:** Orchestrated via Google AI Studio (`gemini-3-flash-preview`) to minimize time-to-first-token (TTFT) and maximize reasoning capabilities for clinical synthesis.
*   **Vector Database:** `pgvector` on Supabase for high-dimensional similarity search, enabling precise retrieval of botanical protocols.
*   **Identity Layer:** Google OAuth 2.0 and OTP verification integrated with Supabase Auth for enterprise-grade security.
*   **Data Ingestion:** Asynchronous pipelines that handle document chunking, embedding generation (using `text-embedding-004`), and indexing.

## 🛠 Technical Deep Dive: pgvector Implementation

For our vector search, we moved beyond basic semantic search to focus on precision at scale.

### 1. Indexing Strategy: HNSW
To maintain sub-250ms latency as the dataset scales, we implemented **HNSW (Hierarchical Navigable Small World)** indexing on our Supabase instance.
*   **Why HNSW?** While it has a higher memory footprint during index creation, it offers superior query speed and high recall compared to IVFFlat, which is critical for real-time agentic responses in a health-tech context.

### 2. Distance Metrics
We utilized **Cosine Distance** ($1 - \cos(\theta)$) for our similarity searches. Given that our embeddings are normalized, Cosine Distance provides the most accurate semantic alignment for the botanical and environmental datasets Nature Nani processes.

$$\text{similarity} = \cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$

### 3. The "Feature Handoff" Logic
Unlike standard chat wrappers, Nature Nani uses a structured **Agentic Handoff** to transition from general consultation to specialized healing modules.
1.  The LLM is prompted to output specific JSON Schemas following the `[METADATA_START]` marker.
2.  A middleware layer validates these schemas and triggers specific React UI components (`BotanicalRx`, `YogaAid`, `NutriHeal`).
3.  This ensures a **"Zero-Hallucination" UI**—the AI can only render components it is explicitly authorized to trigger based on grounded data.

## 🥗 Nutri-Heal Philosophy
The engine is strictly configured for **Sattvic Nutrition**:
*   **Ayurvedic Purity:** Focus on light, life-promoting foods.
*   **Strict Restrictions:** Zero red meat or poultry; specialized legumes and whole grains only.
*   **Ama Detoxification:** Automated suggestions for avoiding toxins based on the user's specific ailment.

## 🚀 Performance Benchmarks
*   **Average Query Latency:** <240ms (End-to-End)
*   **Embedding Dimension:** 768 (Optimized for Gemini `text-embedding-004`)
*   **Uptime:** 99.9% via automated health checks and failover routing.

## 🚦 Roadmap
- [ ] Integration with Vertex AI for custom model tuning.
- [ ] Hybrid Search (combining pgvector with Full-Text Search for specific Sanskrit terms).
- [ ] Multi-modal grounding (Direct Image-to-Vector search for plant identification).

---
*Disclaimer: Nature Nani is an AI-powered educational tool and not a substitute for professional medical advice.*
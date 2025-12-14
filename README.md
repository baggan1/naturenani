
# Nature Nani - Ayurveda & Naturopathy AI Assistant

Nature Nani is a conversational AI assistant that combines ancient wisdom from Ayurveda and Naturopathy with modern Retrieval-Augmented Generation (RAG) technology. It provides personalized remedies, yoga routines, and diet plans.

## Features

- **Holistic Chat Interface**: Conversational AI (Gemini 2.5 Flash) grounded in vector embeddings of traditional texts.
- **RAG Architecture**: Retrieves context from Supabase Vector Database (`documents_gemini` table).
- **Yoga Studio**: Specific yoga pose generation with RAG support, curated stock images, and visual guides.
- **Ayurvedic Kitchen**: Diet plan generation based on ailments (RAG supported), with AI-selected food imagery.
- **User System**: Authentication (Google OAuth / OTP via Supabase), Subscription tiers (Triage vs Healer), and history tracking.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`)
- **Backend/DB**: Supabase (PostgreSQL + pgvector)
- **Icons**: Lucide React

## Setup

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=your_gemini_api_key
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_STRIPE_PAYMENT_LINK=your_stripe_payment_link_url
    ```
4.  **Supabase Setup**:
    - **Extension**: Enable the `vector` extension in Postgres.
    - **Table `documents_gemini`**:
      - `id`: int8 or uuid
      - `content`: text
      - `embedding`: vector(768)
      - `source`: text (Values: 'Ayurveda', 'Naturopathy', 'Yoga', 'diet')
      - `book_name`: text (Optional)
    - **Table `app_users`**: Custom user profiles.
    - **Table `nani_analytics`**: Analytics logging.
    - **Table `nani_saved_plans`**: Storing diet plans JSONB.
    - **RPC Function**: Create `match_documents_gemini` for vector similarity search.

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

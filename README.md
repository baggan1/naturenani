
# Nature Nani - Ayurveda & Naturopathy AI Assistant

Nature Nani is a conversational AI assistant that combines ancient wisdom from Ayurveda and Naturopathy with modern Retrieval-Augmented Generation (RAG) technology.

## 🚀 Supabase Database Setup (CRITICAL)

To enable the **Saving** functionality for Yoga and Diet plans, you must run the following SQL in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

```sql
-- 1. Create the Saved Plans table
CREATE TABLE IF NOT EXISTS nani_saved_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  type TEXT CHECK (type IN ('YOGA', 'DIET')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE nani_saved_plans ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Users can insert their own plans" 
ON nani_saved_plans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own plans" 
ON nani_saved_plans FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans" 
ON nani_saved_plans FOR DELETE 
USING (auth.uid() = user_id);
```

## Features

- **Holistic Chat Interface**: Conversational AI grounded in ancient texts.
- **Evergreen Library**: Save therapeutic protocols for long-term reference.
- **Yoga Aid & Nutri Heal**: Specialized modules for movement and nutrition.

## Tech Stack
- **AI**: Google Gemini 3
- **DB**: Supabase + pgvector
- **Visuals**: Google Custom Search API

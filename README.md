
# Nature Nani - Ayurveda & Naturopathy AI Assistant

Nature Nani is a conversational AI assistant that combines ancient wisdom from Ayurveda and Naturopathy with modern Retrieval-Augmented Generation (RAG) technology.

## 🚀 Supabase Database Setup (CRITICAL)

To fix the "Saving" functionality and 403 errors, run this entire script in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

```sql
-- 1. Create the App Users table (profile data)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_subscribed BOOLEAN DEFAULT false,
  trial_start TIMESTAMPTZ DEFAULT now(),
  trial_end TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the Saved Plans table
CREATE TABLE IF NOT EXISTS nani_saved_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  type TEXT CHECK (type IN ('YOGA', 'DIET')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nani_saved_plans ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for app_users
CREATE POLICY "Users can view own profile" ON app_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON app_users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage all" ON app_users FOR ALL USING (true);

-- 5. RLS Policies for nani_saved_plans (FIXED)
DROP POLICY IF EXISTS "Users can insert their own plans" ON nani_saved_plans;
CREATE POLICY "Users can insert their own plans" 
ON nani_saved_plans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own plans" ON nani_saved_plans;
CREATE POLICY "Users can view their own plans" 
ON nani_saved_plans FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own plans" ON nani_saved_plans;
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


# Nature Nani - Ayurveda & Naturopathy AI Assistant

## 🚀 Supabase Database Setup (Existing Schema)

Run this script in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) to link the AI to your existing Knowledge Base.

### 1. Vector Search Function (The RPC)
Since you already have the `documents_gemini` table, this function enables the frontend to perform similarity searches on it.

```sql
-- This function matches user queries against your existing 'documents_gemini' table
CREATE OR REPLACE FUNCTION match_documents_gemini (
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  source TEXT,
  book_name TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dg.id,
    dg.content,
    dg.source,
    dg.book_name,
    1 - (dg.embedding <=> query_embedding) AS similarity
  FROM documents_gemini dg
  WHERE 1 - (dg.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### 2. Analytics Optimization (NEW)
Add this column to your existing `nani_analytics` table to store book sources as a structured array:

```sql
ALTER TABLE nani_analytics ADD COLUMN IF NOT EXISTS book_sources text[];
```

### 3. User & Subscription Tables
Ensure these tables exist for the trial and library features to function:
```sql
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscription_status TEXT DEFAULT 'free',
  trial_end TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nani_saved_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  type TEXT CHECK (type IN ('YOGA', 'DIET')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

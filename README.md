
# Nature Nani - Ayurveda & Naturopathy AI Assistant

Nature Nani is a conversational AI assistant that combines ancient wisdom from Ayurveda and Naturopathy with modern Retrieval-Augmented Generation (RAG) technology.

## 🚀 Supabase Database Setup (CRITICAL)

To enable the 7-Day Trial system and secure data storage, run this script in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

```sql
-- 1. Create the App Users table (normalized)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trialing', 'active', 'expired', 'canceled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_end TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
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

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
CREATE POLICY "Users can view own profile" ON app_users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
CREATE POLICY "Users can update own profile" ON app_users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON app_users;
CREATE POLICY "Users can insert own profile" ON app_users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own plans" ON nani_saved_plans;
CREATE POLICY "Users can view their own plans" 
ON nani_saved_plans FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Subscribers can insert plans" ON nani_saved_plans;
CREATE POLICY "Subscribers can insert plans" 
ON nani_saved_plans FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid() 
    AND (subscription_status = 'active' OR (subscription_status = 'trialing' AND trial_end > now()))
  )
);
```

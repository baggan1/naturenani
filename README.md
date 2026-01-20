
# Nature Nani - Ayurveda & Naturopathy AI Assistant

## 🚀 Supabase Database Updates

Run these queries in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) to update your existing table for Password Auth and AI Agent support.

### 1. Alter Existing Users Table
This adds tracking for login methods and identifies service/AI agent accounts.

```sql
-- 1. Add the tracking columns
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'otp',
ADD COLUMN IF NOT EXISTS is_service_user BOOLEAN DEFAULT false;

-- 2. (Optional) Set your AI Agent / Service email as a service user
-- Replace 'agent@antigravity.ai' with your actual agent email
UPDATE public.app_users 
SET is_service_user = true, login_method = 'password'
WHERE email = 'agent@antigravity.ai';
```

### 2. Analytics & Saved Plans (If not already created)
```sql
CREATE TABLE IF NOT EXISTS public.nani_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  source TEXT,
  details TEXT,
  book_sources TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.nani_saved_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  type TEXT CHECK (type IN ('YOGA', 'DIET')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

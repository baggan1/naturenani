
# Nature Nani - Database & Agent Setup

## 🚀 1. The Bulletproof Database Sync (Run First)
Run this in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql). This creates the table, the columns, and the trigger correctly.

```sql
-- 1. Create/Fix the Public User Table
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  login_method TEXT DEFAULT 'password',
  subscription_status TEXT DEFAULT 'free',
  trial_end TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  is_service_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the sync function with SECURITY DEFINER
-- This bypasses RLS to ensure new users are ALWAYS saved
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (id, email, name, login_method, subscription_status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nature User'),
    COALESCE(new.raw_app_metadata->>'provider', 'password'),
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.app_users.name);
  RETURN new;
END;
$$;

-- 3. Re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🤖 2. How to Create the "Agent" User
Do not create the Agent from the app UI. Use the following steps:

1.  **Create the Auth Account**: Go to **Authentication > Users** in Supabase and click **"Add User"**.
    - **Email**: `agent@naturenani.com` (or your preferred agent email)
    - **Password**: Must match your `AGENT_PASSWORD` env variable (12+ chars).
2.  **Elevate to Service User**: After creating the user, get their **User ID (UUID)** from the table and run this SQL:

```sql
-- Replace 'USER_ID_HERE' with the UUID from the Auth > Users table
UPDATE public.app_users 
SET is_service_user = true, 
    subscription_status = 'active' 
WHERE id = 'USER_ID_HERE';
```

## 🔒 Security Policy
- Passwords **must** be at least 12 characters.
- Ensure `AGENT_PASSWORD` is set in your environment.


# Nature Nani - Database & Agent Setup

## 🚀 1. The Bulletproof Database Sync (Run First)
Run this in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql). 
This script ensures the `public.app_users` table is perfectly synced with Supabase Auth.

```sql
-- 1. Ensure the public table exists with all required columns
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

-- 2. Create the robust sync function
-- SECURITY DEFINER allows this to run as the owner (bypassing RLS)
-- SET search_path = public ensures it doesn't get lost in schemas
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
EXCEPTION WHEN OTHERS THEN
  -- Prevents the Auth signup from failing even if the public record sync fails
  RETURN new;
END;
$$;

-- 3. Re-attach the trigger to the internal auth table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🤖 2. Create the "Agent" User (Manual Method)

If you see "Trigger Configuration Error" in the app, follow these steps to create your Agent user manually:

1.  **Create Auth Account**:
    - Go to **Authentication > Users** in your Supabase Dashboard.
    - Click **"Add User"** -> **"Create new user"**.
    - **Email**: `agent@naturenani.com`
    - **Password**: `abcxyz909090` (Must match your `AGENT_PASSWORD` env variable).
    - Uncheck "Auto-confirm user" if you want to test email, but usually keep it checked for agents.
2.  **Get the User ID**:
    - Copy the **User ID (UUID)** for this new user from the table.
3.  **Elevate to Service User**:
    - Go to the **SQL Editor** and run this command:

```sql
-- REPLACE 'YOUR_USER_ID_HERE' with the UUID you just copied
UPDATE public.app_users 
SET is_service_user = true, 
    subscription_status = 'active',
    name = 'Agent X'
WHERE id = 'YOUR_USER_ID_HERE';

-- If the row wasn't created by the trigger, run this instead:
INSERT INTO public.app_users (id, email, name, is_service_user, subscription_status)
VALUES ('YOUR_USER_ID_HERE', 'agent@naturenani.com', 'Agent X', true, 'active')
ON CONFLICT (id) DO UPDATE SET is_service_user = true, subscription_status = 'active';
```

## 🔒 Security Policy
- Passwords **must** be at least 12 characters.
- Your Agent password `abcxyz909090` is 12 characters, which is the minimum requirement.

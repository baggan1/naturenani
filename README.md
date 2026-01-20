
# Nature Nani - Ayurveda & Naturopathy AI Assistant

## 🛠️ Supabase Database Setup (Crucial)

Supabase splits user data into two schemas: `auth` (managed by Supabase) and `public` (your app tables). To fix "500 Internal Server Error" on signup, run this script in your **Supabase SQL Editor**.

### 1. Fix Table & Sync Trigger
This script ensures `public.app_users` is synced correctly whenever a new user joins.

```sql
-- 1. Ensure the public table is ready
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'password',
ADD COLUMN IF NOT EXISTS is_service_user BOOLEAN DEFAULT false;

-- 2. Create the sync function with SECURITY DEFINER
-- This allows the function to bypass RLS and insert the user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (id, email, name, login_method, subscription_status, trial_end)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nature User'),
    COALESCE(new.raw_app_metadata->>'provider', 'password'),
    'free',
    now() + interval '7 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- 3. Attach the trigger to the hidden 'auth.users' table
-- Even if you don't 'see' this table in the public list, it exists in the auth schema.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 🔒 Security Configuration

### Service User & Agent Access
For the "Service User" (automated agent) login, ensure you have set the password in your environment.

```env
# Store this in your deployment platform's env settings
AGENT_PASSWORD=your_secure_12_plus_char_password
```

### Password Policy
The application strictly enforces a **12-character minimum password length** to prevent brute-force attacks on sensitive accounts.

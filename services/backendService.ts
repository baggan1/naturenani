import { createClient } from '@supabase/supabase-js';
import { User, RemedyDocument, SearchSource, QueryUsage } from '../types';
import { TRIAL_DAYS, DAILY_QUERY_LIMIT } from '../utils/constants';

// Initialize Supabase Client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://biblbpmlpchztyifoypt.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpYmxicG1scGNoenR5aWZveXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODUxMjksImV4cCI6MjA3OTE2MTEyOX0.qmwrUIvkhjp7jB2Tb9E5ORQZPHVLyirjmhPe3tr9Lbk';

const supabase = (supabaseUrl && supabaseKey && supabaseKey !== 'PASTE_YOUR_ANON_KEY_HERE') 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

if (!supabase) {
  console.warn("Supabase keys missing. App running in offline mode.");
}

const CURRENT_USER_KEY = 'nature_nani_current_user';

// --- Analytics Logging & Usage Limits ---

export const checkDailyQueryLimit = async (user: User): Promise<QueryUsage> => {
  if (user.is_subscribed) {
    return { count: 0, limit: -1, remaining: 9999, isUnlimited: true };
  }

  if (!supabase) return { count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false };

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Count analytics logs for this user in the last 24 hours
    const { count, error } = await supabase
      .from('nani_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('created_at', oneDayAgo);

    if (error) {
      console.warn("Usage check error:", error.message);
      return { count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false };
    }

    const used = count || 0;
    return {
      count: used,
      limit: DAILY_QUERY_LIMIT,
      remaining: Math.max(0, DAILY_QUERY_LIMIT - used),
      isUnlimited: false
    };
  } catch (e) {
    return { count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false };
  }
};

export const logAnalyticsEvent = async (query: string, source: SearchSource, details?: string) => {
  if (!supabase) return;
  try {
    const user = getCurrentUser();
    if (!user) return; // Don't log for guests who haven't finished auth
    
    const payload = { 
      query, 
      source, 
      details,
      user_id: user.id 
    };
    const { error } = await supabase.from('nani_analytics').insert(payload);
    if (error) console.warn("Analytics log failed:", error.message);
  } catch (e) { console.warn("Analytics error:", e); }
};

export const getUserSearchHistory = async (user: User): Promise<string[]> => {
  if (!supabase) return [];
  try {
    let query = supabase
      .from('nani_analytics')
      .select('query, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Triage Tier Limitation: Only see history from last 24 hours
    if (!user.is_subscribed) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gt('created_at', oneDayAgo);
    }
    
    const { data, error } = await query.limit(50);

    if (error) {
      console.warn("History fetch error:", error.message);
      return [];
    }

    // Deduplicate: Get unique queries only
    const distinctQueries = Array.from(new Set((data || []).map((item: any) => item.query as string))) as string[];
    return distinctQueries.slice(0, 5); // Return top 5
  } catch (e) {
    console.warn("History error:", e);
    return [];
  }
};

// --- Vector Search ---

export const warmupDatabase = async () => {
  if (!supabase) return;
  try {
    console.log("[Supabase] Warming up...");
    await supabase.rpc('match_documents_gemini', {
      query_embedding: new Array(768).fill(0.01),
      match_threshold: 0.01,
      match_count: 1
    });
  } catch (e) { /* Ignore */ }
};

export const searchVectorDatabase = async (queryText: string, queryEmbedding: number[] | null): Promise<RemedyDocument[]> => {
  if (!supabase || !queryEmbedding) return getMockRemedies(queryText);

  try {
    const performSearch = async () => await supabase.rpc('match_documents_gemini', {
      query_embedding: queryEmbedding, 
      match_threshold: 0.4,
      match_count: 3
    });

    let { data, error } = await performSearch();

    if (error && error.code === '57014') {
      console.warn("Database timeout. Retrying in 4s...");
      await new Promise(resolve => setTimeout(resolve, 4000));
      const retry = await performSearch();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      if (error.code === '57014') {
        console.warn("Supabase Search Timeout. Falling back to offline mode.");
        console.warn("FIX: Run `ALTER FUNCTION match_documents_gemini(vector, float, int) SET statement_timeout = '10000ms';` in SQL Editor.");
      }
      else if (error.code === '42501') console.error("RLS Policy Error. Check Supabase settings.");
      return getMockRemedies(queryText);
    }

    return (data || []).map((doc: any) => ({
      id: doc.id.toString(),
      condition: 'Related Topic',
      content: doc.content,
      source: doc.source,
      book_name: doc.book_name,
      similarity: doc.similarity
    }));
  } catch (e) {
    return getMockRemedies(queryText);
  }
};

// --- Auth & User Management ---

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Database not connected");
  
  // Debug Log for configuration
  const redirectUrl = window.location.origin;
  console.log(`[Auth] OAuth Redirect URL: ${redirectUrl}`);
  
  if (supabaseUrl.includes('biblbpmlpchztyifoypt')) {
     console.warn("[Auth] Warning: You are using the demo Supabase project. Google Sign-In will likely fail (403) because you cannot add this domain to the demo project's Google Cloud Console. Please use your own Supabase project keys.");
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  });
  if (error) throw error;
};

// OTP Step 1: Send Code
export const sendOtp = async (email: string) => {
  if (!supabase) {
    console.log(`[MOCK] OTP sent to ${email}`);
    return;
  }
  
  // Note: If you want a 6-digit code, ensure your email template in Supabase uses {{ .Token }}
  // and not the link variable.
  const { error } = await supabase.auth.signInWithOtp({ 
    email,
    options: {
      // Ensure specific redirect is passed if Supabase requires it for magic link context
      emailRedirectTo: window.location.origin
    }
  });
  
  if (error) throw error;
};

// OTP Step 2: Verify Code
export const verifyOtp = async (email: string, token: string): Promise<User> => {
  if (!supabase) {
    // Mock for offline demo
    if (token === '123456') {
      return await signUpUser(email, "Guest User");
    }
    throw new Error("Invalid code (Mock: use 123456)");
  }
  
  const { data: { session }, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });

  if (error || !session?.user?.email) throw error || new Error("Verification failed");

  return await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User");
};

// Helper to get or create user in our custom table after Auth
const getOrCreateUser = async (email: string, name: string): Promise<User> => {
  if (!supabase) return signUpUser(email, name);

  // Check if user exists in our custom table
  const { data: existingUser } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    const user = existingUser as User;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  } else {
    // New User -> Sign Up Flow
    return await signUpUser(email, name);
  }
};

export const signUpUser = async (email: string, name: string): Promise<User> => {
  // Calculate Trial Dates
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DAYS); // 30 Days

  const newUserPayload = {
    email,
    name,
    is_subscribed: false,
    trial_start: startDate.toISOString(),
    trial_end: endDate.toISOString(),
    stripe_customer_id: undefined
  };

  let user: User;

  if (supabase) {
     const { data, error } = await supabase
      .from('app_users')
      .insert(newUserPayload)
      .select()
      .single();

    if (error) {
      // If error is duplicate, try fetching
      const { data: existing } = await supabase.from('app_users').select('*').eq('email', email).single();
      if (existing) {
        user = existing as User;
      } else {
        throw new Error("Could not create user.");
      }
    } else {
      user = data as User;
    }
  } else {
    // Mock
    user = {
      ...newUserPayload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

export const logoutUser = async () => {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(CURRENT_USER_KEY);
};

// --- Subscription Service (Stripe Integration) ---

export const checkSubscriptionStatus = async (user: User): Promise<{ hasAccess: boolean, daysRemaining: number }> => {
  // If subscribed, valid forever (until cancelled)
  if (user.is_subscribed) return { hasAccess: true, daysRemaining: 30 };
  
  // Check Trial
  const now = new Date();
  const trialEnd = new Date(user.trial_end);
  const diffTime = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    hasAccess: daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining)
  };
};

export const initiateStripeCheckout = async (user: User): Promise<void> => {
  console.log(`[Stripe] Initiating Checkout for ${user.email}...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (!supabase) return;

  // Simulate Webhook success -> Update DB
  await supabase
    .from('app_users')
    .update({ 
      is_subscribed: true, 
      stripe_customer_id: `cus_${crypto.randomUUID().slice(0,8)}` 
    })
    .eq('id', user.id);

  const updatedUser = { ...user, is_subscribed: true };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  window.location.reload(); 
};

export const createStripePortalSession = async () => {
  console.log("Redirecting to billing portal...");
  alert("Redirecting to Stripe Billing Portal to manage your Healer Plan...");
};


// --- Fallbacks ---

const getMockRemedies = (query: string): RemedyDocument[] => {
  const q = query.toLowerCase();
  const mockDocs: RemedyDocument[] = [
    { id: '1', condition: 'Headache', content: 'Hydrotherapy: Hot foot bath.', source: 'Naturopathy', book_name: 'Nature Cure' },
    { id: '2', condition: 'Headache', content: 'Ginger tea for Vata.', source: 'Ayurveda', book_name: 'Ayurveda Science' },
    { id: '3', condition: 'Anxiety', content: 'Pranayama and Ashwagandha.', source: 'Ayurveda', book_name: 'Mind Health' },
    { id: '4', condition: 'Digestion', content: 'Chew food 32 times.', source: 'Naturopathy', book_name: 'Diet Reform' },
    { id: '5', condition: 'Digestion', content: 'Cumin water after meals.', source: 'Ayurveda', book_name: 'Home Remedies' },
  ];
  return mockDocs.filter(d => q.includes(d.condition.toLowerCase()) || d.content.toLowerCase().includes(q));
};
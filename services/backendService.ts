import { createClient } from '@supabase/supabase-js';
import { User, RemedyDocument, SearchSource, QueryUsage, SavedMealPlan, DayPlan } from '../types';
import { TRIAL_DAYS, DAILY_QUERY_LIMIT } from '../utils/constants';

// Initialize Supabase Client
// We rely on process.env which is polyfilled in vite.config.ts to support both VITE_ and standard env vars
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log(`[Supabase] Initializing... URL configured: ${!!supabaseUrl}`);

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

if (!supabase) {
  console.warn("[Supabase] Keys missing. App running in offline mode.");
}

const CURRENT_USER_KEY = 'nature_nani_current_user';
const SAVED_PLANS_KEY = 'nature_nani_saved_plans';

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

export const searchVectorDatabase = async (
  queryText: string, 
  queryEmbedding: number[] | null,
  filterSource?: string // Optional filter for 'Yoga' or 'diet'
): Promise<RemedyDocument[]> => {
  if (!supabase || !queryEmbedding) return getMockRemedies(queryText);

  try {
    // Increase match_count to 20 to allow for filtering after retrieval
    // since the RPC might not support source filtering natively
    const performSearch = async () => await supabase.rpc('match_documents_gemini', {
      query_embedding: queryEmbedding, 
      match_threshold: 0.35, // Slightly lower threshold to ensure we get results for specific sources
      match_count: 20
    });

    let { data, error } = await performSearch();

    // Handle Timeouts - Reduced retry wait time from 4s to 1s for better UX
    if (error && error.code === '57014') {
      console.warn("Database timeout. Retrying in 1s...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retry = await performSearch();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[Supabase] RAG Search Error:", error);
      if (error.code === '57014') {
        console.warn("Supabase Search Timeout. Falling back to offline mode.");
      }
      return getMockRemedies(queryText);
    }

    // Client-side filtering if filterSource is provided
    let results = (data || []).map((doc: any) => ({
      id: doc.id.toString(),
      condition: 'Related Topic',
      content: doc.content,
      source: doc.source,
      book_name: doc.book_name,
      similarity: doc.similarity
    }));

    if (filterSource) {
      results = results.filter((r: RemedyDocument) => 
        r.source && r.source.toLowerCase() === filterSource.toLowerCase()
      );
    }
    
    // Fallback if filtering removed all results (don't return empty if possible, but for strict mode we might want to)
    // If no results for 'Yoga', we might return empty array so Gemini falls back to general knowledge, 
    // or we return top 3 general results? 
    // Logic: If filterSource is explicit, return only matching. If 0 matching, return 0. 
    // The calling service handles 0 docs by using general knowledge.
    
    console.log(`[RAG] Found ${results.length} docs matching ${filterSource || 'ALL'}`);

    return results.slice(0, 5); // Return top 5 matches
  } catch (e) {
    console.error("[Supabase] Unexpected RAG Error", e);
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
  
  const { error } = await supabase.auth.signInWithOtp({ 
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  
  if (error) throw error;
};

// OTP Step 2: Verify Code
export const verifyOtp = async (email: string, token: string): Promise<User> => {
  if (!supabase) {
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

/**
 * Listens for Supabase Auth state changes (specifically Session recovery after OAuth redirect)
 */
export const setupAuthListener = (onLogin: (user: User) => void) => {
  if (!supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    // These events trigger on page load if the user is authenticated (via cookie/redirect)
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (session?.user?.email) {
        console.log("[Auth] Session detected:", event);
        try {
          const user = await getOrCreateUser(
            session.user.email, 
            session.user.user_metadata?.full_name || "User"
          );
          onLogin(user);
        } catch (e) {
          console.error("[Auth] Error syncing user:", e);
        }
      }
    }
  });

  return () => {
    subscription.unsubscribe();
  };
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
  
  // 1. Check if we have a real Payment Link configured
  const stripePaymentLink = process.env.REACT_APP_STRIPE_PAYMENT_LINK;
  
  if (stripePaymentLink) {
    // REAL MODE: Redirect to Stripe Payment Link
    // We pass the email to pre-fill it for the user
    const separator = stripePaymentLink.includes('?') ? '&' : '?';
    window.location.href = `${stripePaymentLink}${separator}prefilled_email=${encodeURIComponent(user.email)}`;
    return;
  }

  // 2. Mock Mode (For Demo Only)
  console.warn("STRIPE_PAYMENT_LINK is missing. Falling back to Mock Payment.");
  
  const confirmed = window.confirm(
    "Setup Required: To make real payments work, add 'VITE_STRIPE_PAYMENT_LINK' to your environment variables.\n\nClick OK to simulate a successful payment for now."
  );

  if (!confirmed) return;

  await new Promise(resolve => setTimeout(resolve, 1500));
  
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
  const portalLink = process.env.REACT_APP_STRIPE_PORTAL_LINK;
  const user = getCurrentUser();

  if (portalLink) {
    // Trim to avoid accidental spaces from copy-paste
    let targetUrl = portalLink.trim();

    // Pre-fill email for better UX if the link supports it
    // Note: Stripe "No-Code" Customer Portal Login pages support ?prefilled_email=
    if (user && user.email) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}prefilled_email=${encodeURIComponent(user.email)}`;
    }

    console.log(`[Stripe] Redirecting to Portal: ${targetUrl}`);
    window.location.href = targetUrl;
    return;
  }

  console.log("Redirecting to billing portal...");
  alert("Setup Required: Add 'VITE_STRIPE_PORTAL_LINK' to your .env file to enable the Customer Portal.");
};


// --- Meal Plan Saving Logic ---

export const saveMealPlan = async (user: User, plan: DayPlan[], title: string): Promise<SavedMealPlan | null> => {
  if (!plan || plan.length === 0) return null;

  const newPlan: SavedMealPlan = {
    id: crypto.randomUUID(),
    user_id: user.id,
    title,
    created_at: new Date().toISOString(),
    plan_data: plan
  };

  // 1. Try Saving to Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('nani_saved_plans')
        .insert({
          user_id: user.id,
          title: title,
          plan_data: plan // Stores as JSONB
        })
        .select()
        .single();
      
      if (!error && data) {
        return data as SavedMealPlan;
      }
      console.warn("Failed to save to Supabase:", error);
    } catch (e) {
      console.warn("Supabase Save Error:", e);
    }
  }

  // 2. Fallback to LocalStorage
  try {
    const existing = localStorage.getItem(SAVED_PLANS_KEY);
    const plans: SavedMealPlan[] = existing ? JSON.parse(existing) : [];
    // Ensure we don't duplicate by ID if we are in mock mode
    if (!plans.find(p => p.id === newPlan.id)) {
      plans.unshift(newPlan);
      localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans));
    }
    return newPlan;
  } catch (e) {
    console.error("Local Save Error", e);
    return null;
  }
};

export const getUserMealPlans = async (user: User): Promise<SavedMealPlan[]> => {
  let plans: SavedMealPlan[] = [];

  // 1. Get from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('nani_saved_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        plans = data as SavedMealPlan[];
      }
    } catch (e) { console.warn("Fetch Plans Error", e); }
  }

  // 2. Merge with LocalStorage (for fallback/offline created plans)
  try {
    const local = localStorage.getItem(SAVED_PLANS_KEY);
    if (local) {
      const localPlans: SavedMealPlan[] = JSON.parse(local);
      const userLocalPlans = localPlans.filter(p => p.user_id === user.id);
      
      // Deduplicate: If ID exists in Supabase result, prefer Supabase
      const existingIds = new Set(plans.map(p => p.id));
      userLocalPlans.forEach(p => {
        if (!existingIds.has(p.id)) {
          plans.push(p);
        }
      });
    }
  } catch(e) {}

  // Sort by date desc
  return plans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

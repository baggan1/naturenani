
import { createClient } from '@supabase/supabase-js';
import { User, RemedyDocument, SearchSource, QueryUsage, SavedMealPlan, DayPlan, YogaPose, SavedYogaPlan } from '../types';
import { TRIAL_DAYS, DAILY_QUERY_LIMIT } from '../utils/constants';

// Initialize Supabase Client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Using 'any' for the client to bypass version-specific type mismatches in the environment
const supabase: any = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const CURRENT_USER_KEY = 'nature_nani_current_user';

/**
 * Helper to provide fallback remedies when vector search is unavailable or returns no results.
 */
const getMockRemedies = (query: string): RemedyDocument[] => {
  return [
    {
      id: 'mock-1',
      condition: query,
      content: 'A soothing ginger and honey tea can help alleviate the symptoms described. In Ayurveda, this balances Kapha and Vata.',
      source: 'Ayurveda',
      book_name: 'Traditional Home Remedies'
    },
    {
      id: 'mock-2',
      condition: query,
      content: 'Drinking warm water with lemon in the morning helps detoxify the digestive system, a common practice in Naturopathy.',
      source: 'Naturopathy',
      book_name: 'Natural Living Guide'
    }
  ];
};

export const checkDailyQueryLimit = async (user: User): Promise<QueryUsage> => {
  if (user.is_subscribed) {
    return { count: 0, limit: -1, remaining: 9999, isUnlimited: true };
  }

  if (!supabase) return { count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false };

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
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
    if (!user) return; 
    
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

    if (!user.is_subscribed) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      query = query.gt('created_at', oneDayAgo);
    }
    
    const { data, error } = await query.limit(50);

    if (error) return [];

    const distinctQueries = Array.from(new Set((data || []).map((item: any) => item.query as string))) as string[];
    return distinctQueries.slice(0, 5); 
  } catch (e) {
    return [];
  }
};

export const warmupDatabase = async () => {
  if (!supabase) return;
  try {
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
  filterSource?: string 
): Promise<RemedyDocument[]> => {
  if (!supabase || !queryEmbedding) return getMockRemedies(queryText);

  try {
    const { data, error } = await supabase.rpc('match_documents_gemini', {
      query_embedding: queryEmbedding, 
      match_threshold: 0.35, 
      match_count: 10
    });

    if (error) {
      console.error("[Supabase] Search Error:", error.message);
      return getMockRemedies(queryText);
    }

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

    return results.slice(0, 5); 
  } catch (e) {
    return getMockRemedies(queryText);
  }
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Database not connected");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    }
  });
  if (error) throw error;
};

export const sendOtp = async (email: string) => {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOtp({ 
    email,
    options: { emailRedirectTo: window.location.origin }
  });
  if (error) throw error;
};

export const verifyOtp = async (email: string, token: string): Promise<User> => {
  if (!supabase) {
    if (token === '123456') return await signUpUser(email, "Guest User");
    throw new Error("Invalid code");
  }
  const { data: { session }, error } = await supabase.auth.verifyOtp({
    email, token, type: 'email'
  });
  if (error || !session?.user?.email) throw error || new Error("Verification failed");
  return await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User");
};

export const signUpUser = async (email: string, name: string): Promise<User> => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DAYS); 

  let authUserId: string | undefined;
  if (supabase) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    authUserId = authUser?.id;
  }

  const newUserPayload: any = {
    email, 
    name,
    is_subscribed: false,
    trial_start: startDate.toISOString(),
    trial_end: endDate.toISOString(),
  };

  if (authUserId) {
    newUserPayload.id = authUserId;
  }

  let user: User;
  if (supabase) {
     const { data, error } = await supabase
      .from('app_users')
      .upsert(newUserPayload)
      .select()
      .single();

    if (error) {
      console.error("[Backend] Profile sync error:", error.message);
      const { data: existing } = await supabase.from('app_users').select('*').eq('email', email).single();
      if (existing) {
        user = existing as User;
      } else {
        user = { ...newUserPayload, id: authUserId || crypto.randomUUID(), created_at: new Date().toISOString() } as User;
      }
    } else {
      user = data as User;
    }
  } else {
    user = { ...newUserPayload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

const getOrCreateUser = async (email: string, name: string): Promise<User> => {
  if (!supabase) return signUpUser(email, name);
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const targetId = authUser?.id;

  const { data: existingUser } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    if (targetId && existingUser.id !== targetId) {
      console.warn("[Backend] User ID mismatch detected. Repairing profile...");
      const { data: repaired } = await supabase
        .from('app_users')
        .upsert({ ...existingUser, id: targetId })
        .select()
        .single();
      const finalUser = (repaired || existingUser) as User;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(finalUser));
      return finalUser;
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existingUser));
    return existingUser as User;
  }
  
  return signUpUser(email, name);
};

/**
 * Checks the current user's subscription or trial status.
 */
export const checkSubscriptionStatus = async (user: User) => {
  if (user.is_subscribed) return { hasAccess: true, daysRemaining: 999, isTrialExpired: false };
  const end = new Date(user.trial_end);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return {
    hasAccess: days > 0,
    daysRemaining: Math.max(0, days),
    isTrialExpired: days <= 0
  };
};

/**
 * Sign out the current user and clear local storage.
 */
export const logoutUser = async () => {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.reload();
};

/**
 * Setup listener for Supabase authentication state changes.
 */
export const setupAuthListener = (onAuthChange: (user: User) => void) => {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
    if (event === 'SIGNED_IN' && session?.user?.email) {
      const user = await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User");
      onAuthChange(user);
    }
  });
  return () => subscription.unsubscribe();
};

/**
 * Redirect user to Stripe Checkout for subscription upgrade.
 */
export const initiateStripeCheckout = async (user: User) => {
  const stripeLink = process.env.REACT_APP_STRIPE_PAYMENT_LINK;
  if (!stripeLink) return;
  const url = new URL(stripeLink);
  url.searchParams.set('prefilled_email', user.email);
  window.location.href = url.toString();
};

/**
 * Redirect user to Stripe Customer Portal for billing management.
 */
export const createStripePortalSession = async () => {
  const portalLink = process.env.REACT_APP_STRIPE_PORTAL_LINK;
  if (portalLink) window.location.href = portalLink;
};

/**
 * Saves a yoga plan for the user in Supabase.
 */
export const saveYogaPlan = async (user: User, poses: YogaPose[], title: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('nani_yoga_plans').insert({
    user_id: user.id,
    title,
    poses
  }).select().single();
  return error ? null : data;
};

/**
 * Saves a meal plan for the user in Supabase.
 */
export const saveMealPlan = async (user: User, plan_data: DayPlan[], title: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase.from('nani_meal_plans').insert({
    user_id: user.id,
    title,
    plan_data
  }).select().single();
  return error ? null : data;
};

/**
 * Fetches the user's saved library items (meal plans and yoga routines).
 */
export const getUserLibrary = async (user: User) => {
  if (!supabase) return { diet: [], yoga: [] };
  const [dietRes, yogaRes] = await Promise.all([
    supabase.from('nani_meal_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('nani_yoga_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  ]);
  return {
    diet: dietRes.data || [],
    yoga: yogaRes.data || []
  };
};

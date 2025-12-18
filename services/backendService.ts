
import { createClient } from '@supabase/supabase-js';
import { User, RemedyDocument, SearchSource, QueryUsage, SavedMealPlan, DayPlan, YogaPose, SavedYogaPlan } from '../types';
import { TRIAL_DAYS, DAILY_QUERY_LIMIT } from '../utils/constants';

// Initialize Supabase Client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Fix: Use 'any' type for the supabase client to resolve Property 'signInWithOAuth' and other Auth method errors appearing on SupabaseAuthClient
const supabase: any = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const CURRENT_USER_KEY = 'nature_nani_current_user';

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
  
  // Always try to fetch actual auth user first to ensure IDs are matched
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const targetId = authUser?.id;

  const { data: existingUser } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    // If IDs don't match, we might need to repair the record if RLS is broken
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
  return await signUpUser(email, name);
};

export const setupAuthListener = (onLogin: (user: User) => void) => {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (session?.user?.email) {
        try {
          const user = await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User");
          onLogin(user);
        } catch (e) {
          console.error("[Backend] Auth listener error:", e);
        }
      }
    }
  });
  return () => subscription.unsubscribe();
};

export const logoutUser = async () => {
  try {
    if (supabase) await supabase.auth.signOut();
  } catch (e) {
    console.warn("SignOut error:", e);
  } finally {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.origin;
  }
};

export const checkSubscriptionStatus = async (user: User): Promise<{ hasAccess: boolean, daysRemaining: number }> => {
  if (user.is_subscribed) return { hasAccess: true, daysRemaining: 30 };
  const diffTime = new Date(user.trial_end).getTime() - Date.now();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { hasAccess: daysRemaining > 0, daysRemaining: Math.max(0, daysRemaining) };
};

export const initiateStripeCheckout = async (user: User): Promise<void> => {
  const stripePaymentLink = process.env.REACT_APP_STRIPE_PAYMENT_LINK;
  if (stripePaymentLink) {
    const sep = stripePaymentLink.includes('?') ? '&' : '?';
    window.location.href = `${stripePaymentLink}${sep}prefilled_email=${encodeURIComponent(user.email)}`;
    return;
  }
  if (!supabase) return;
  await supabase.from('app_users').update({ is_subscribed: true }).eq('id', user.id);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ ...user, is_subscribed: true }));
  window.location.reload(); 
};

export const createStripePortalSession = async () => {
  const portalLink = process.env.REACT_APP_STRIPE_PORTAL_LINK;
  const user = getCurrentUser();
  if (portalLink && user) {
    const sep = portalLink.includes('?') ? '&' : '?';
    window.location.href = `${portalLink}${sep}prefilled_email=${encodeURIComponent(user.email)}`;
  }
};

export const saveMealPlan = async (user: User, plan: DayPlan[], title: string): Promise<SavedMealPlan | null> => {
  if (!plan || plan.length === 0 || !supabase) {
    console.error("[Backend] Cannot save: Database or plan missing.");
    return null;
  }
  
  // Double-check auth status before saving
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
     console.error("[Backend] Auth session missing. Please sign in again.");
     return null;
  }

  const { data, error } = await supabase.from('nani_saved_plans').insert({ 
    user_id: authUser.id, // Explicitly use the session ID to satisfy RLS
    title, 
    plan_data: plan, 
    type: 'DIET' 
  }).select().single();
  
  if (error) {
    console.error("[Backend] Supabase RLS Violation/Error:", error.message);
    return null;
  }
  return data as SavedMealPlan;
};

export const saveYogaPlan = async (user: User, poses: YogaPose[], title: string): Promise<SavedYogaPlan | null> => {
  if (!poses || poses.length === 0 || !supabase) {
    console.error("[Backend] Cannot save: Database or poses missing.");
    return null;
  }
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
     console.error("[Backend] Auth session missing. Please sign in again.");
     return null;
  }

  const { data, error } = await supabase.from('nani_saved_plans').insert({ 
    user_id: authUser.id, // Explicitly use the session ID to satisfy RLS
    title, 
    plan_data: poses, 
    type: 'YOGA' 
  }).select().single();
  
  if (error) {
    console.error("[Backend] Supabase RLS Violation/Error:", error.message);
    return null;
  }
  return data as SavedYogaPlan;
};

export const getUserLibrary = async (user: User): Promise<{diet: SavedMealPlan[], yoga: SavedYogaPlan[]}> => {
  if (!supabase) return { diet: [], yoga: [] };
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const targetId = authUser?.id || user.id;

  const { data, error } = await supabase
    .from('nani_saved_plans')
    .select('*')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("[Backend] Library Fetch Error:", error.message);
    return { diet: [], yoga: [] };
  }
  
  const library = data || [];
  return {
    diet: library.filter((l: any) => l.type === 'DIET').map((l: any) => ({ ...l, plan_data: l.plan_data })),
    yoga: library.filter((l: any) => l.type === 'YOGA').map((l: any) => ({ ...l, poses: l.plan_data }))
  };
};

const getMockRemedies = (query: string): RemedyDocument[] => {
  const q = query.toLowerCase();
  const mockDocs: RemedyDocument[] = [
    { id: '1', condition: 'Headache', content: 'Hydrotherapy: Hot foot bath.', source: 'Naturopathy' },
    { id: '2', condition: 'Headache', content: 'Ginger tea for Vata.', source: 'Ayurveda' },
    { id: '3', condition: 'Anxiety', content: 'Pranayama and Ashwagandha.', source: 'Ayurveda' },
  ];
  return mockDocs.filter(d => q.includes(d.condition.toLowerCase()));
};

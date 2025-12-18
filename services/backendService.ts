
import { createClient } from '@supabase/supabase-js';
import { User, RemedyDocument, SearchSource, QueryUsage, SavedMealPlan, DayPlan, YogaPose, SavedYogaPlan } from '../types';
import { DAILY_QUERY_LIMIT } from '../utils/constants';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase: any = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const CURRENT_USER_KEY = 'nature_nani_current_user';

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

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
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
    await supabase.from('nani_analytics').insert(payload);
  } catch (e) {}
};

export const getUserSearchHistory = async (user: User): Promise<string[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('nani_analytics')
      .select('query')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    
    const queryList: string[] = (data as any[]).map(item => String(item.query));
    const distinctQueries = Array.from(new Set(queryList));
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
  } catch (e) {}
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

    if (error) return getMockRemedies(queryText);

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

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Database not connected");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
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
  if (!supabase) throw new Error("Database not connected");
  const { data: { session }, error } = await supabase.auth.verifyOtp({
    email, token, type: 'email'
  });
  if (error || !session?.user?.email) throw error || new Error("Verification failed");
  return await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User");
};

export const signUpUser = async (email: string, name: string): Promise<User> => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 100); // effectively free forever

  let authUserId: string | undefined;
  if (supabase) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    authUserId = authUser?.id;
  }

  const userObj: any = {
    email, 
    name,
    is_subscribed: false,
    trial_start: startDate.toISOString(),
    trial_end: endDate.toISOString(),
  };

  if (authUserId) userObj.id = authUserId;

  if (supabase) {
    const { data, error } = await supabase.from('app_users').upsert(userObj).select().single();
    if (!error && data) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
      return data as User;
    }
  }

  const fallbackUser = { ...userObj, id: authUserId || crypto.randomUUID(), created_at: new Date().toISOString() };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fallbackUser));
  return fallbackUser as User;
};

const getOrCreateUser = async (email: string, name: string): Promise<User> => {
  if (!supabase) return signUpUser(email, name);
  
  const { data: existingUser } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
  if (existingUser) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existingUser));
    return existingUser as User;
  }
  
  return await signUpUser(email, name);
};

export const checkSubscriptionStatus = async (user: User) => {
  // Free plan is now forever. Access is controlled by limits in the UI/Logic.
  return { hasAccess: true, daysRemaining: 999, isTrialExpired: false };
};

export const logoutUser = async () => {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(CURRENT_USER_KEY);
  window.location.reload();
};

export const setupAuthListener = (onAuthChange: (user: User) => void) => {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.email) {
      const user = await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User");
      onAuthChange(user);
    }
  });
  return () => subscription.unsubscribe();
};

export const initiateStripeCheckout = async (user: User) => {
  const stripeLink = process.env.REACT_APP_STRIPE_PAYMENT_LINK;
  if (!stripeLink) return;
  const url = new URL(stripeLink);
  url.searchParams.set('prefilled_email', user.email);
  window.location.href = url.toString();
};

export const createStripePortalSession = async () => {
  const portalLink = process.env.REACT_APP_STRIPE_PORTAL_LINK;
  if (portalLink) window.location.href = portalLink;
};

const saveToLibrary = async (user: User, planData: any, title: string, type: 'YOGA' | 'DIET') => {
  if (!supabase) return null;
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const uid = authUser?.id || user.id;

  const { data, error } = await supabase.from('nani_saved_plans').insert({
    user_id: uid,
    title,
    plan_data: planData,
    type: type
  }).select().single();

  if (error) {
    console.error(`[Backend] Save ${type} failed:`, error.message);
    return null;
  }
  return data;
};

export const saveYogaPlan = async (user: User, poses: YogaPose[], title: string) => {
  return await saveToLibrary(user, poses, title, 'YOGA');
};

export const saveMealPlan = async (user: User, plan_data: DayPlan[], title: string) => {
  return await saveToLibrary(user, plan_data, title, 'DIET');
};

export const getUserLibrary = async (user: User) => {
  if (!supabase) return { diet: [], yoga: [] };
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const uid = authUser?.id || user.id;

  const { data, error } = await supabase
    .from('nani_saved_plans')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (error || !data) return { diet: [], yoga: [] };

  return {
    diet: data.filter((item: any) => item.type === 'DIET'),
    yoga: data.filter((item: any) => item.type === 'YOGA').map((item: any) => ({
      ...item,
      poses: item.plan_data 
    }))
  };
};

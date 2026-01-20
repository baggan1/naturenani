
import { createClient } from '@supabase/supabase-js';
import { User, RemedyDocument, SearchSource, QueryUsage, SavedMealPlan, DayPlan, YogaPose, SavedYogaPlan, SubscriptionStatus } from '../types';
import { DAILY_QUERY_LIMIT } from '../utils/constants';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase: any = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const CURRENT_USER_KEY = 'nature_nani_current_user';

const safeStorage = {
  getItem: (key: string) => {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  setItem: (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch (e) {}
  },
  removeItem: (key: string) => {
    try { localStorage.removeItem(key); } catch (e) {}
  }
};

const getMockRemedies = (query: string): RemedyDocument[] => {
  return [
    {
      id: 'mock-1',
      condition: query,
      content: 'A soothing ginger and honey tea can help alleviate the symptoms described.',
      source: 'Ayurveda',
      book_name: 'Traditional Home Remedies'
    },
    {
      id: 'mock-2',
      condition: query,
      content: 'Drinking warm water with lemon helps detoxify the digestive system.',
      source: 'Naturopathy',
      book_name: 'Natural Living Guide'
    }
  ];
};

export const getCurrentUser = (): User | null => {
  const stored = safeStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
};

export const fetchUserRecord = async (email: string): Promise<User | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) return null;

    if (data) {
      safeStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
      return data as User;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const checkDailyQueryLimit = async (user: User): Promise<QueryUsage> => {
  if (user.subscription_status === 'active' || user.subscription_status === 'trialing' || (user as any).is_service_user) {
    return { count: 0, limit: -1, remaining: 9999, isUnlimited: true };
  }

  if (!supabase) return { count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false };

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const { count, error } = await supabase
      .from('nani_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('created_at', oneDayAgo);

    clearTimeout(timeoutId);

    if (error) throw error;

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

export const logAnalyticsEvent = async (query: string, source: SearchSource, bookSources: string[] = []) => {
  if (!supabase) return;
  try {
    const user = getCurrentUser();
    if (!user) return; 
    
    const payload = { 
      query, 
      source, 
      details: bookSources.join(', '), 
      book_sources: bookSources,       
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
      .limit(10);

    if (error || !data) return [];
    const queryList: string[] = (data as any[]).map(item => String(item.query));
    return Array.from(new Set(queryList)).slice(0, 5); 
  } catch (e) {
    return [];
  }
};

export const warmupDatabase = async () => {
  if (!supabase) return;
  try {
    await supabase.from('app_users').select('id').limit(1);
  } catch (e) {}
};

export const searchVectorDatabase = async (
  queryText: string, 
  queryEmbedding: number[] | null
): Promise<RemedyDocument[]> => {
  if (!supabase || !queryEmbedding) return getMockRemedies(queryText);

  try {
    const dbPromise = supabase.rpc('match_documents_gemini', {
      query_embedding: queryEmbedding, 
      match_threshold: 0.35, 
      match_count: 5
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database Timeout')), 5000)
    );

    const { data, error } = await (Promise.race([dbPromise, timeoutPromise]) as any);

    if (error || !data) return getMockRemedies(queryText);

    return data.map((doc: any) => ({
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
  return await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User", 'otp');
};

/**
 * Traditional Password Registration
 */
export const signUpWithPassword = async (email: string, password: string, name: string): Promise<User> => {
  if (!supabase) throw new Error("Database not connected");
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  });
  if (error) throw error;
  if (!user?.email) throw new Error("Sign up failed");
  return await getOrCreateUser(user.email, name, 'password');
};

/**
 * Traditional Password Login
 */
export const signInWithPassword = async (email: string, password: string): Promise<User> => {
  if (!supabase) throw new Error("Database not connected");
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  if (!user?.email) throw new Error("Sign in failed");
  return await getOrCreateUser(user.email, user.user_metadata?.full_name || "User", 'password');
};

export const signUpUser = async (email: string, name: string, method: string = 'otp'): Promise<User> => {
  const trialEnd = new Date();
  let authUserId: string | undefined;
  if (supabase) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    authUserId = authUser?.id;
  }
  const userObj: any = {
    email, 
    name,
    subscription_status: 'free',
    trial_end: trialEnd.toISOString(),
    login_method: method
  };
  if (authUserId) userObj.id = authUserId;
  if (supabase) {
    const { data, error } = await supabase.from('app_users').upsert(userObj).select().single();
    if (!error && data) {
      safeStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
      return data as User;
    }
  }
  const fallbackUser = { ...userObj, id: authUserId || crypto.randomUUID(), created_at: new Date().toISOString() };
  safeStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fallbackUser));
  return fallbackUser as User;
};

const getOrCreateUser = async (email: string, name: string, method: string = 'otp'): Promise<User> => {
  if (!supabase) return signUpUser(email, name, method);
  const { data: existingUser } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
  if (existingUser) {
    // Check if the user is trying to "downgrade" a google account to a different method
    if (existingUser.login_method === 'google' && method !== 'google') {
       // Logic to prevent accidental downgrade could go here, 
       // but for now we just update their local cache
    }
    safeStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existingUser));
    return existingUser as User;
  }
  return await signUpUser(email, name, method);
};

export const checkSubscriptionStatus = async (user: User) => {
  const now = new Date();
  const trialEnd = user.trial_end ? new Date(user.trial_end) : now;
  const billingEnd = user.current_period_end ? new Date(user.current_period_end) : null;
  let status = user.subscription_status;
  if (status === 'trialing' && now > trialEnd) status = 'expired';
  if (status === 'active' && billingEnd && now > billingEnd) status = 'expired';
  const hasAccess = status === 'trialing' || status === 'active';
  const targetDate = status === 'active' && billingEnd ? billingEnd : trialEnd;
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return { hasAccess, status, daysRemaining, isTrialExpired: status === 'expired', nextBillingDate: billingEnd?.toISOString() || null };
};

export const logoutUser = async () => {
  try { if (supabase) await supabase.auth.signOut(); } catch (e) {}
  finally {
    safeStorage.removeItem(CURRENT_USER_KEY);
    window.location.reload();
  }
};

export const setupAuthListener = (onAuthChange: (user: User | null) => void) => {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.email) {
      const provider = session.user.app_metadata.provider || 'password';
      const user = await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User", provider);
      onAuthChange(user);
    } else if (event === 'SIGNED_OUT') {
      onAuthChange(null);
    }
  });
  return () => subscription.unsubscribe();
};

export const initiateStripeCheckout = async (user: User) => {
  const stripeLink = process.env.REACT_APP_STRIPE_PAYMENT_LINK;
  if (!stripeLink) return;
  const url = new URL(stripeLink);
  url.searchParams.set('prefilled_email', user.email);
  url.searchParams.set('client_reference_id', user.id);
  window.location.href = url.toString();
};

export const createStripePortalSession = async () => {
  const portalLink = process.env.REACT_APP_STRIPE_PORTAL_LINK;
  if (portalLink) window.location.href = portalLink;
};

export const saveYogaPlan = async (user: User, poses: YogaPose[], title: string) => {
  if (!supabase) return null;
  return await supabase.from('nani_saved_plans').insert({ user_id: user.id, title, plan_data: poses, type: 'YOGA' }).select().single();
};

export const saveMealPlan = async (user: User, plan_data: DayPlan[], title: string) => {
  if (!supabase) return null;
  return await supabase.from('nani_saved_plans').insert({ user_id: user.id, title, plan_data, type: 'DIET' }).select().single();
};

export const getUserLibrary = async (user: User) => {
  if (!supabase) return { diet: [], yoga: [] };
  const { data } = await supabase.from('nani_saved_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (!data) return { diet: [], yoga: [] };
  return {
    diet: data.filter((item: any) => item.type === 'DIET'),
    yoga: data.filter((item: any) => item.type === 'YOGA').map((item: any) => ({ ...item, poses: item.plan_data }))
  };
};

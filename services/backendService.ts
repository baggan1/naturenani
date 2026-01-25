import { createClient } from '@supabase/supabase-js';
import { User, RemedyDocument, SearchSource, QueryUsage, SavedMealPlan, DayPlan, YogaPose, SavedYogaPlan, SubscriptionStatus } from '../types';
import { DAILY_QUERY_LIMIT } from '../utils/constants';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const AGENT_PASSWORD = process.env.AGENT_PASSWORD;

const supabase: any = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const CURRENT_USER_KEY = 'nature_nani_current_user';

// Health check on boot
if (supabase) {
  supabase.from('app_users').select('id', { count: 'exact', head: true })
    .then(({ error }: any) => {
      if (error) console.error("[Supabase Health Check Failed]", error.message);
      else console.log("[Supabase Connection] Status: Optimal");
    });
}

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

export const getCurrentUser = (): User | null => {
  const stored = safeStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    if (!user.id || typeof user.id !== 'string') return null;
    return user;
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
  if (!user?.id) return { count: 0, limit: DAILY_QUERY_LIMIT, remaining: DAILY_QUERY_LIMIT, isUnlimited: false };
  const isServiceUser = (user as any).is_service_user === true;
  
  if (user.subscription_status === 'active' || user.subscription_status === 'trialing' || isServiceUser) {
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
    if (!user?.id) return; 
    const payload = { query, source, details: bookSources.join(', '), book_sources: bookSources, user_id: user.id };
    await supabase.from('nani_analytics').insert(payload);
  } catch (e) {}
};

export const getUserSearchHistory = async (user: User): Promise<string[]> => {
  if (!supabase || !user?.id) return [];
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
  try { await supabase.from('app_users').select('id').limit(1); } catch (e) {}
};

export const searchVectorDatabase = async (queryText: string, queryEmbedding: number[] | null): Promise<RemedyDocument[]> => {
  if (!supabase || !queryEmbedding) return [];
  try {
    const { data, error } = await supabase.rpc('match_documents_gemini', {
      query_embedding: queryEmbedding, 
      match_threshold: 0.35, 
      match_count: 5
    });
    if (error || !data) return [];
    return data.map((doc: any) => ({
      id: doc.id.toString(),
      condition: 'Related Topic',
      content: doc.content,
      source: doc.source,
      book_name: doc.book_name,
      similarity: doc.similarity
    }));
  } catch (e) { return []; }
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
  const { data: { session }, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error || !session?.user?.email) throw error || new Error("Verification failed");
  return await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User", 'otp', session.user.id);
};

export const signUpWithPassword = async (email: string, password: string, name: string): Promise<User> => {
  if (!supabase) throw new Error("Database not connected");
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { full_name: name } }
  });
  if (error) throw error;
  const user = data?.user;
  if (!user?.email) throw new Error("Registration failed");
  await new Promise(resolve => setTimeout(resolve, 1000));
  return await getOrCreateUser(user.email, name, 'password', user.id);
};

export const signInWithPassword = async (email: string, password: string): Promise<User> => {
  if (!supabase) throw new Error("Database not connected");
  const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!user?.email) throw new Error("Sign in failed");
  return await getOrCreateUser(user.email, user.user_metadata?.full_name || "User", 'password', user.id);
};

export const signUpUser = async (email: string, name: string, method: string = 'otp', explicitId?: string): Promise<User> => {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);
  let authUserId = explicitId;
  if (!authUserId && supabase) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    authUserId = authUser?.id;
  }
  const userObj: any = { email, name, subscription_status: 'free', trial_end: trialEnd.toISOString(), login_method: method };
  if (authUserId) userObj.id = authUserId;
  if (supabase && authUserId) {
    try {
      const { data, error } = await supabase.from('app_users').upsert(userObj).select().single();
      if (!error && data) {
        safeStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
        return data as User;
      }
    } catch (e) {}
  }
  const fallbackUser = { ...userObj, id: authUserId || crypto.randomUUID(), created_at: new Date().toISOString() };
  safeStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fallbackUser));
  return fallbackUser as User;
};

const getOrCreateUser = async (email: string, name: string, method: string = 'otp', explicitId?: string): Promise<User> => {
  if (!supabase) return signUpUser(email, name, method, explicitId);
  const { data: existingUser, error } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
  if (!error && existingUser) {
    safeStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existingUser));
    return existingUser as User;
  }
  return await signUpUser(email, name, method, explicitId);
};

export const checkSubscriptionStatus = async (user: User) => {
  const now = new Date();
  if (!user?.id) return { hasAccess: false, status: 'free', daysRemaining: 0, isTrialExpired: false, nextBillingDate: null };
  if ((user as any).is_service_user === true) return { hasAccess: true, status: 'active', daysRemaining: 999, isTrialExpired: false, nextBillingDate: null };
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
      const user = await getOrCreateUser(session.user.email, session.user.user_metadata?.full_name || "User", provider, session.user.id);
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

/**
 * PHASE 3: ROLLING LIBRARY MANAGEMENT (FIFO Logic)
 * Counts unique ailments by title. If >= 5, deletes the oldest ailment entirely.
 */
const enforceRollingLimit = async (userId: string, targetTitle: string): Promise<string> => {
  if (!supabase || !userId) return userId;
  
  // SESSION RE-VERIFICATION: Always get fresh ID to prevent 400 errors
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) throw new Error("Authentication failed. Please sign in again.");
  const verifiedId = authUser.id;

  try {
    const { data, error } = await supabase
      .from('nani_saved_plans')
      .select('title, created_at')
      .eq('user_id', verifiedId)
      .order('created_at', { ascending: true });

    if (error || !data) return verifiedId;

    const uniqueTitles = Array.from(new Set(data.map((item: any) => item.title.toLowerCase().trim())));
    const currentTitleLower = targetTitle.toLowerCase().trim();

    // If limit reached and this is a NEW ailment
    if (uniqueTitles.length >= 5 && !uniqueTitles.includes(currentTitleLower)) {
      const oldestAilmentTitle = data[0].title;
      await supabase.from('nani_saved_plans').delete().eq('user_id', verifiedId).eq('title', oldestAilmentTitle);
      console.log(`[Rolling Library] FIFO triggered: Retired "${oldestAilmentTitle}"`);
    }
    return verifiedId;
  } catch (e) {
    console.error("[Rolling Library] Critical Error:", e);
    return verifiedId;
  }
};

export const saveYogaPlan = async (user: User, poses: YogaPose[], title: string) => {
  if (!supabase || !user?.id) return null;
  const verifiedId = await enforceRollingLimit(user.id, title);
  const { data, error } = await supabase.from('nani_saved_plans').insert({ 
    user_id: verifiedId, title: title.trim(), plan_data: poses, type: 'YOGA' 
  }).select().single();
  return error ? null : data;
};

export const saveMealPlan = async (user: User, plan_data: DayPlan[], title: string) => {
  if (!supabase || !user?.id) return null;
  const verifiedId = await enforceRollingLimit(user.id, title);
  const { data, error } = await supabase.from('nani_saved_plans').insert({ 
    user_id: verifiedId, title: title.trim(), plan_data: plan_data, type: 'DIET' 
  }).select().single();
  return error ? null : data;
};

export const saveRemedy = async (user: User, detail: string, title: string) => {
  if (!supabase || !user?.id || !detail) return null;
  try {
    const verifiedId = await enforceRollingLimit(user.id, title);
    const { data, error } = await supabase.from('nani_saved_plans').insert({ 
      user_id: verifiedId, title: title.trim(), plan_data: { detail }, type: 'REMEDY' 
    }).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[saveRemedy] Insert failed:", e);
    return null;
  }
};

export const getUserLibrary = async (user: User) => {
  if (!supabase || !user?.id) return { diet: [], yoga: [], remedy: [] };
  try {
    const { data, error } = await supabase.from('nani_saved_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error || !data) return { diet: [], yoga: [], remedy: [] };
    return {
      diet: data.filter((item: any) => item.type === 'DIET'),
      yoga: data.filter((item: any) => item.type === 'YOGA').map((item: any) => ({ ...item, poses: item.plan_data })),
      remedy: data.filter((item: any) => item.type === 'REMEDY').map((item: any) => ({ ...item, detail: item.plan_data?.detail }))
    };
  } catch (e) { return { diet: [], yoga: [], remedy: [] }; }
};

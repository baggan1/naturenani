
export interface User {
  id: string;
  email: string;
  name: string;
  is_subscribed: boolean;
  stripe_customer_id?: string;
  trial_start: string; // ISO Date String
  trial_end: string;   // ISO Date String
  created_at: string;
}

export interface RemedyDocument {
  id: string;
  condition: string;
  content: string;
  source: 'Ayurveda' | 'Naturopathy';
  book_name?: string;
  similarity?: number;
}

// Metadata parsed from the LLM JSON block
export interface RecommendationMetadata {
  type: 'YOGA' | 'DIET';
  id: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string; // The visible text
  timestamp: number;
  sources?: RemedyDocument[]; 
  recommendation?: RecommendationMetadata; // The hidden app intent
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  trialDays: number;
}

export enum AppView {
  AUTH = 'AUTH',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  ANALYTICS = 'ANALYTICS',
  ACCOUNT = 'ACCOUNT',
  YOGA = 'YOGA', 
  DIET = 'DIET'
}

export type SearchSource = 'RAG' | 'GoogleSearch' | 'Hybrid' | 'AI';

export interface AnalyticsEvent {
  id: string;
  query: string;
  source: SearchSource;
  timestamp: number;
  details?: string;
}

export interface QueryUsage {
  count: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

// Data passed from Chat to Premium Views
export interface FeatureContext {
  id: string; // e.g., "LOWER_BACK_01"
  title: string;
}

export interface YogaPose {
  id: number;
  name: string;
  english: string;
  duration: string;
  benefit: string;
  color?: string;
  instructions: string[];
  breathing: string;
  reps: string;
}

// --- Diet & Kitchen Types ---

export interface Meal {
  type: string;
  name: string;
  ingredients: string[];
  instructions: string;
  image_keyword: string;
}

export interface DayPlan {
  day: string;
  meals: Meal[];
}

export interface SavedMealPlan {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  plan_data: DayPlan[];
}

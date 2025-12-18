
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
  source: 'Ayurveda' | 'Naturopathy' | 'Yoga' | 'diet' | string;
  book_name?: string;
  similarity?: number;
}

// SearchSource defines the origin of the information provided to the user
export type SearchSource = 'RAG' | 'AI' | 'Search';

export interface RecommendationMetadata {
  type: 'YOGA' | 'DIET';
  id: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string; 
  timestamp: number;
  sources?: RemedyDocument[]; 
  recommendations?: RecommendationMetadata[]; 
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

export interface QueryUsage {
  count: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}

export interface FeatureContext {
  id: string; 
  title: string;
}

export interface YogaPose {
  pose_name: string;
  benefit: string;
  contraindications: string;
  image_url?: string; // Fetched from Search API
}

export interface Meal {
  type: string;
  dish_name: string;
  search_query: string;
  ingredients: string[];
  benefit: string;
  image_url?: string; // Fetched from Search API
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

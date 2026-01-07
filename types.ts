
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'expired' | 'canceled';

export interface User {
  id: string;
  email: string;
  name: string;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string; 
  current_period_end?: string;      
  trial_end: string;
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

export type SearchSource = 'RAG' | 'AI' | 'Search';

export interface RecommendationMetadata {
  type: 'YOGA' | 'DIET' | 'REMEDY';
  id: string;
  title: string;
  summary: string;
  detail?: string; 
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string; 
  timestamp: number;
  sources?: RemedyDocument[]; 
  recommendations?: RecommendationMetadata[]; 
  suggestions?: string[]; // Progressive follow-up options
}

export enum AppView {
  AUTH = 'AUTH',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  ANALYTICS = 'ANALYTICS',
  ACCOUNT = 'ACCOUNT',
  YOGA = 'YOGA', 
  DIET = 'DIET',
  LIBRARY = 'LIBRARY',
  BRANDING = 'BRANDING',
  LEGAL = 'LEGAL',
  ABOUT = 'ABOUT',
  VOICE = 'VOICE'
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
  type: 'Asana' | 'Pranayama';
  benefit: string;
  instructions: string;
  contraindications: string;
  image_url?: string; 
}

export interface Meal {
  type: string;
  dish_name: string;
  search_query: string;
  ingredients: string[];
  benefit: string;
  image_url?: string; 
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

export interface SavedYogaPlan {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  poses: YogaPose[];
}

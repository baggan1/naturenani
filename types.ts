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

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  sources?: RemedyDocument[]; // Added for Credibility UI
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
  ACCOUNT = 'ACCOUNT'
}

export type SearchSource = 'RAG' | 'GoogleSearch' | 'Hybrid' | 'AI';

export interface AnalyticsEvent {
  id: string;
  query: string;
  source: SearchSource;
  timestamp: number;
  details?: string; // e.g., "Found 3 docs" or "Used Google Search"
}

export interface QueryUsage {
  count: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
}
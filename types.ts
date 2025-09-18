import { Chat, Part } from "@google/genai";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Source = {
  title: string;
  uri: string;
}

// Represents citation metadata from the Gemini API
export interface Citation {
  startIndex?: number;
  endIndex?: number;
  uri: string;
  license?: string;
}

export interface ComparisonTableData {
  headers: string[];
  rows: string[][];
}

export interface FinalAnswer {
  text: string;
  sources: Source[];
  citations: Citation[] | null;
  table?: ComparisonTableData | null;
}

export type SearchHistoryItem = Database['public']['Tables']['search_history']['Row'];

export interface ImageSearchResult {
    imageUrl: string;
    sourceUrl: string;
    title: string;
}

// FIX: Add missing NewsArticle type for Discover, Finance, and Article pages.
export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  summary: string;
  publishedAt: string;
  imageUrl?: string;
}

// FIX: Add missing types for the Finance page.
export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  percentChange: string;
  isPositive: boolean;
}

export interface StockMover {
  ticker: string;
  name: string;
  price: string;
  percentChange: string;
  isPositive: boolean;
}

export interface FinanceData {
  marketIndices: MarketIndex[];
  marketAnalysis: string;
  topMovers: {
    gainers: StockMover[];
    losers: StockMover[];
  };
  financialNews: NewsArticle[];
}


export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: Source[];
  citations?: Citation[] | null;
  table?: ComparisonTableData | null;
  file?: {
    name: string;
    type: string;
    previewUrl: string;
  };
  images?: ImageSearchResult[] | null;
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ar';
export type ModelType = 'gemini' | 'deepseek';

export interface Personalization {
  introduction: string;
  location: string;
}

export type Database = {
  public: {
    Tables: {
      search_history: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_deep_research: boolean
          query: string
          title: string | null
          sources: Json | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_deep_research?: boolean
          query: string
          title?: string | null
          sources?: Json | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_deep_research?: boolean
          query?: string
          title?: string | null
          sources?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      delete_user_account: {
        Args: {}
        Returns: void
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
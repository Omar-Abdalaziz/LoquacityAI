

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
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ar';

export interface Personalization {
  introduction: string;
  location: string;
}

export interface NewsArticle {
  title: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  source: string;
  publishedAt: string; // ISO 8601 string
}

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
  change: string;
  percentChange: string;
  isPositive: boolean;
}

export interface FinanceData {
  marketIndices: MarketIndex[];
  topMovers: {
    gainers: StockMover[];
    losers: StockMover[];
  };
  marketAnalysis: string;
  financialNews: NewsArticle[];
}

export interface GeneratedImage {
    src: string; // base64 data URL
    prompt: string;
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
// FIX: Removed unused imports from @google/genai
// import { Chat, Part } from "@google/ai";

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

export type SearchHistoryItem = Database['public']['Tables']['search_history']['Row'];
export type Workspace = Database['public']['Tables']['workspaces']['Row'];


export interface ImageSearchResult {
    imageUrl: string;
    sourceUrl: string;
    title: string;
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

// FIX: Added missing NewsArticle type definition
export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  summary: string;
}

// FIX: Added missing MarketIndex type definition
export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  percentChange: string;
  isPositive: boolean;
}

// FIX: Added missing StockMover type definition
export interface StockMover {
  ticker: string;
  name: string;
  price: string;
  percentChange: string;
  isPositive: boolean;
}

// FIX: Added missing FinanceData type definition
export interface FinanceData {
  marketIndices: MarketIndex[];
  marketAnalysis: string;
  topMovers: {
    gainers: StockMover[];
    losers: StockMover[];
  };
  financialNews: NewsArticle[];
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ar';
export type ModelType = 'gemini' | 'mistral';

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
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_workspace_id_fkey"
            columns: ["workspace_id"]
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
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
      shared_chats: {
        Row: {
          chat_data: Json
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          chat_data: Json
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          chat_data?: Json
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_chats_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workspaces: {
        Row: {
          id: string
          user_id: string
          name: string
          summary: string | null
          color: string | null
          icon: string | null
          created_at: string
          is_pinned: boolean
          updated_at: string
          share_id: string | null
          is_public: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          summary?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
          is_pinned?: boolean
          updated_at?: string
          share_id?: string | null
          is_public?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          summary?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
          is_pinned?: boolean
          updated_at?: string
          share_id?: string | null
          is_public?: boolean
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
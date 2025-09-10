import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = 'https://gvrxmaekjhzqgwqxgrdl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2cnhtYWVramh6cWd3cXhncmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODAxMTIsImV4cCI6MjA2ODg1NjExMn0.N8SebU4IHmbh9mhyRzg9OkWskhuWy040bOOqPfEgnkc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { AuthPage } from './components/AuthPage';
import { SearchPage } from './components/SearchPage';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an active session on initial load
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setLoading(false);
    });

    // Set up the listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-neutral-100 dark:bg-neutral-900">
      {session && session.user ? <SearchPage session={session} /> : <AuthPage />}
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { useTheme } from './contexts/ThemeContext';
import { AuthPage } from './components/AuthPage';
import { SearchPage } from './components/SearchPage';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-950">
            <div className="animate-pulse">
                <LogoIcon className="w-16 h-16 text-brand-500" />
            </div>
        </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 antialiased">
      {!session ? (
        <AuthPage />
      ) : (
        <SearchPage key={session.user.id} session={session} />
      )}
    </div>
  );
};

export default App;
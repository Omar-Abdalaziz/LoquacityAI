import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';
import { LogoIcon, LogoWordmark } from './icons';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { t } = useLocalization();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(t('auth.confirmationEmail'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
       <div className="text-center mb-10 animate-fade-in flex flex-col items-center gap-4">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 shadow-lg">
            <LogoIcon className="w-12 h-12 text-white" />
          </div>
          <LogoWordmark className="h-8 text-neutral-800 dark:text-neutral-200" />
          <p className="text-neutral-500 dark:text-neutral-400 -mt-2">
            {t('auth.subtitle')}
          </p>
      </div>

      <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl shadow-black/5 animate-pop-in">
        <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white">
          {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
        </h2>
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">
              {t('auth.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-neutral-900 dark:text-white transition-colors"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2"
            >
              {t('auth.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-neutral-900 dark:text-white transition-colors"
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 rounded-lg text-white font-semibold transition-all duration-300 disabled:bg-neutral-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100"
          >
            {loading ? t('auth.processing') : (isSignUp ? t('auth.submitSignUp') : t('auth.submitSignIn'))}
          </button>
        </form>

        {error && <p className="text-sm text-center text-red-600 dark:text-red-400">{error}</p>}
        {message && <p className="text-sm text-center text-green-600 dark:text-green-400">{message}</p>}

        <p className="text-sm text-center text-neutral-500 dark:text-neutral-400">
          {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}{' '}
          <button
            onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
            }}
            className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {isSignUp ? t('auth.signIn') : t('auth.submitSignUp')}
          </button>
        </p>
      </div>
    </div>
  );
};
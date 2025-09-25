import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocalization } from '../contexts/LocalizationContext';
import { LogoIcon, LogoWordmark, EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon, CheckCircleIcon } from './icons';

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
    <div className="min-h-screen w-full bg-white dark:bg-neutral-950 lg:grid lg:grid-cols-2">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-400 animate-gradient-move text-white text-center relative overflow-hidden">
        <div className="z-10 flex flex-col items-center">
            <div className="w-24 h-24 mb-6 flex items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm shadow-lg">
                <LogoIcon className="w-16 h-16 text-white" />
            </div>
            <LogoWordmark className="h-10 text-white mb-4" />
            <p className="text-xl max-w-sm text-white/80">
                {t('auth.tagline')}
            </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8 animate-fade-in flex flex-col items-center gap-4">
              <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 shadow-lg">
                <LogoIcon className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="animate-pop-in">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                    {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                    {t('auth.subtitle')}
                </p>

                {error && (
                    <div className="mb-4 flex items-start gap-3 p-3 text-sm text-red-800 bg-red-50 dark:text-red-300 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-500/30">
                        <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}
                {message && (
                    <div className="mb-4 flex items-start gap-3 p-3 text-sm text-green-800 bg-green-50 dark:text-green-300 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-500/30">
                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{message}</p>
                    </div>
                )}
                
                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2 sr-only">
                            {t('auth.emailLabel')}
                        </label>
                        <div className="relative">
                            <EnvelopeIcon className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                            <input
                            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-11 rtl:pl-4 rtl:pr-11 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-brand-500 rounded-lg placeholder-neutral-500 focus:outline-none focus:ring-0 text-neutral-900 dark:text-white transition-colors"
                            placeholder={t('auth.emailPlaceholder')}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2 sr-only">
                            {t('auth.passwordLabel')}
                        </label>
                         <div className="relative">
                            <LockClosedIcon className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
                            <input
                            id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            required minLength={6}
                            className="w-full pl-11 rtl:pl-4 rtl:pr-11 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-brand-500 rounded-lg placeholder-neutral-500 focus:outline-none focus:ring-0 text-neutral-900 dark:text-white transition-colors"
                            placeholder={t('auth.passwordPlaceholder')}
                            />
                        </div>
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 rounded-lg text-white font-semibold transition-all duration-200 disabled:bg-neutral-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-950 focus:ring-brand-500"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                {t('auth.processing')}
                            </div>
                        ) : (isSignUp ? t('auth.submitSignUp') : t('auth.submitSignIn'))}
                    </button>
                </form>

                <p className="mt-8 text-sm text-center text-neutral-500 dark:text-neutral-400">
                {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}{' '}
                <button
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                    {isSignUp ? t('auth.signIn') : t('auth.submitSignUp')}
                </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
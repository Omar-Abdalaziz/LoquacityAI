import React, { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { UserCircleIcon, GlobeAltIcon, PaintBrushIcon, SunIcon, MoonIcon, ComputerDesktopIcon, XIcon, ChevronDownIcon, CheckIcon, ChatBubbleOvalLeftEllipsisIcon } from './icons';
import { Language, Personalization } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
}

const ConfirmationModal = ({ title, children, onCancel, onConfirm, loading, t }: { title: string, children: React.ReactNode, onCancel: () => void, onConfirm: () => void, loading: boolean, t: (key: string) => string }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" aria-modal="true" role="dialog">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all animate-pop-in">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{title}</h3>
            <div className="text-neutral-600 dark:text-neutral-300 mt-2">
                {children}
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-md bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-800 dark:text-white font-semibold transition-colors disabled:opacity-50">
                    {t('settings.account.cancel')}
                </button>
                <button 
                    onClick={onConfirm} disabled={loading}
                    className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                    {loading ? t('auth.processing') : t('settings.account.confirm')}
                </button>
            </div>
        </div>
    </div>
);


const AccountSettings = ({ session, onClose }: { session: Session; onClose: () => void; }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<{ full_name: string }>({ full_name: '' });
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [confirmAction, setConfirmAction] = useState<'deleteHistory' | 'deleteAccount' | null>(null);
    const { t } = useLocalization();

    useEffect(() => {
        const fetchProfile = async () => {
          setLoading(true);
          const { data, error } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
          if (error && error.code !== 'PGRST116') setMessage({ type: 'error', text: t('settings.account.updateError')});
          else if (data) setProfile({ full_name: (data as any).full_name || '' });
          setLoading(false);
        };
        fetchProfile();
      }, [session.user.id, t]);
    
      const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true); setMessage(null);
        const { error } = await supabase.from('profiles').upsert({ id: session.user.id, full_name: profile.full_name, updated_at: new Date().toISOString() } as any);
        if (error) setMessage({type: 'error', text: error.message});
        else setMessage({type: 'success', text: t('settings.account.updateSuccess')});
        setLoading(false);
      }

      const handleDeleteAllChats = async () => {
        setLoading(true); setMessage(null);
        try {
            const { error } = await supabase.from('search_history').delete().eq('user_id', session.user.id);
            if (error) throw error;
            onClose(); window.location.reload();
        } catch (error: any) { setMessage({type: 'error', text: `${t('search.error.failedToDeleteHistory')}: ${error.message}`});
        } finally { setLoading(false); setConfirmAction(null); }
      }
      
      const handleDeleteAccount = async () => {
        setLoading(true); setMessage(null);
        try {
            const { error: rpcError } = await supabase.rpc('delete_user_account');
            if (rpcError) throw rpcError;
            await supabase.auth.signOut();
        } catch (error: any) {
            setMessage({type: 'error', text: `An error occurred during account deletion.`});
            setLoading(false); setConfirmAction(null);
        }
      }
    
    const renderConfirmModal = () => {
        if (!confirmAction) return null;
        const isDeletingHistory = confirmAction === 'deleteHistory';
        const title = isDeletingHistory ? t('settings.account.confirmDeleteHistoryTitle') : t('settings.account.confirmDeleteAccountTitle');
        const content = isDeletingHistory ? t('settings.account.confirmDeleteHistoryMessage') : t('settings.account.confirmDeleteAccountMessage');
        return <ConfirmationModal title={title} onCancel={() => setConfirmAction(null)} onConfirm={isDeletingHistory ? handleDeleteAllChats : handleDeleteAccount} loading={loading} t={t}><p>{content}</p></ConfirmationModal>
    }

    return (
        <div>
            {renderConfirmModal()}
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">{t('settings.account.title')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">{t('settings.account.subtitle')}</p>

            <div className="p-6 space-y-6 bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{t('settings.account.profileInfo')}</h3>
                <div className="flex items-center gap-4">
                    <UserCircleIcon className="w-20 h-20 text-neutral-400 dark:text-neutral-500" />
                    <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">{profile.full_name || 'New User'}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{session.user.email}</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700/50">
                     <div>
                        <label htmlFor="fullName" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-2">{t('settings.account.fullName')}</label>
                        <input id="fullName" type="text" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                            className="w-full max-w-sm px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder={t('settings.account.fullNamePlaceholder')} disabled={loading}
                        />
                    </div>
                     <button type="submit" disabled={loading} className="py-2 px-5 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 rounded-md text-white font-semibold transition-colors disabled:bg-neutral-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed">
                        {loading ? t('settings.account.saving') : t('settings.account.saveChanges')}
                    </button>
                </form>
            </div>
            
            <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{t('settings.account.dangerZone')}</h3>
                <div className="mt-4 space-y-4">
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">{t('settings.account.deleteAllChats')}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('settings.account.deleteAllChatsSubtitle')}</p>
                        </div>
                        <button onClick={() => setConfirmAction('deleteHistory')} disabled={loading} className="mt-2 sm:mt-0 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition-colors disabled:opacity-50">
                            {loading && confirmAction === 'deleteHistory' ? t('settings.account.deletingChats') : t('settings.account.deleteAllChatsButton')}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-red-200 dark:border-red-900/30">
                         <div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">{t('settings.account.deleteAccount')}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('settings.account.deleteAccountSubtitle')}</p>
                        </div>
                        <button onClick={() => setConfirmAction('deleteAccount')} disabled={loading} className="mt-2 sm:mt-0 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition-colors disabled:opacity-50">
                             {loading && confirmAction === 'deleteAccount' ? t('settings.account.deletingAccount') : t('settings.account.deleteAccountButton')}
                        </button>
                    </div>
                </div>
            </div>

            {message && <div className={`mt-4 text-sm text-center p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>{message.text}</div>}
        </div>
    );
}

const LanguageSwitcher = () => {
    const { language, setLanguage, t } = useLocalization();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const languages: { id: Language, label: string }[] = [{ id: 'en', label: t('settings.language.english') }, { id: 'ar', label: t('settings.language.arabic') }];
    const currentLanguage = languages.find(l => l.id === language);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full max-w-xs" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700/60 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500">
                <span className="flex items-center gap-2"><GlobeAltIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />{currentLanguage?.label}</span>
                <ChevronDownIcon className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10 animate-pop-in">
                    <ul className="py-1">
                        {languages.map(lang => (
                            <li key={lang.id}><button onClick={() => { setLanguage(lang.id); setIsOpen(false); }} className="w-full text-left rtl:text-right px-4 py-2 flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors">{lang.label}{language === lang.id && <CheckIcon className="w-5 h-5 text-brand-500" />}</button></li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const AppearanceSettings = () => {
    const { theme, setTheme } = useTheme();
    const { t } = useLocalization();
    const themeOptions = [{ id: 'light', label: t('settings.appearance.light'), icon: SunIcon }, { id: 'dark', label: t('settings.appearance.dark'), icon: MoonIcon }, { id: 'system', label: t('settings.appearance.system'), icon: ComputerDesktopIcon }];
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">{t('settings.appearance.title')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">{t('settings.appearance.subtitle')}</p>
            <div className="p-6 space-y-6 bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{t('settings.appearance.theme')}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('settings.appearance.themeSubtitle')}</p>
                <div className="flex flex-col sm:flex-row gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-900/70 p-1.5">
                   {themeOptions.map(option => {
                        const Icon = option.icon, isActive = theme === option.id;
                        return (<button key={option.id} onClick={() => setTheme(option.id as any)} aria-pressed={isActive}
                            className={`w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${isActive ? 'bg-brand-600 text-white shadow' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700/50'}`}>
                            <Icon className="w-5 h-5" />{option.label}
                        </button>)
                   })}
                </div>
            </div>
            <div className="p-6 mt-8 space-y-6 bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{t('settings.language.title')}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('settings.language.subtitle')}</p>
                <LanguageSwitcher />
            </div>
        </div>
    );
};

const PersonalizationSettings = () => {
    const { personalization, setPersonalization } = usePersonalization();
    const [localState, setLocalState] = useState<Personalization>(personalization);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useLocalization();
    const timeoutRef = useRef<number | null>(null);
    useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLocalState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setLoading(true); setMessage(null);
        setTimeout(() => { setPersonalization(localState); setLoading(false); setMessage(t('settings.personalization.saveSuccess')); timeoutRef.current = window.setTimeout(() => setMessage(null), 3000); }, 500);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">{t('settings.personalization.title')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">{t('settings.personalization.subtitle')}</p>
            <form onSubmit={handleSave} className="p-6 space-y-8 bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
                <div className="space-y-2">
                    <label htmlFor="introduction" className="text-lg font-bold text-neutral-900 dark:text-white">{t('settings.personalization.introductionLabel')}</label>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('settings.personalization.introductionSubtitle')}</p>
                    <textarea id="introduction" name="introduction" value={localState.introduction} onChange={handleChange} rows={4} disabled={loading}
                        className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder={t('settings.personalization.introductionPlaceholder')}
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="location" className="text-lg font-bold text-neutral-900 dark:text-white">{t('settings.personalization.locationLabel')}</label>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{t('settings.personalization.locationSubtitle')}</p>
                    <input id="location" name="location" type="text" value={localState.location} onChange={handleChange} disabled={loading}
                        className="w-full max-w-sm px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder={t('settings.personalization.locationPlaceholder')}
                    />
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <button type="submit" disabled={loading} className="py-2 px-5 bg-brand-600 hover:bg-brand-700 dark:hover:bg-brand-500 rounded-md text-white font-semibold transition-colors disabled:bg-neutral-400 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed">
                        {loading ? t('settings.personalization.saving') : t('settings.personalization.saveButton')}
                    </button>
                    {message && <p className="text-sm text-green-600 dark:text-green-400 animate-fade-in">{message}</p>}
                </div>
            </form>
        </div>
    );
};

export const ProfilePage: React.FC<SettingsModalProps> = ({ isOpen, onClose, session }) => {
  const [activeTab, setActiveTab] = useState('account');
  const { t } = useLocalization();
  const navItems = [ { id: 'account', label: t('settings.account.title'), icon: UserCircleIcon }, { id: 'appearance', label: t('settings.appearance.title'), icon: PaintBrushIcon }, { id: 'personalization', label: t('settings.personalization.title'), icon: ChatBubbleOvalLeftEllipsisIcon }];
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;
  
  const renderContent = () => {
    switch (activeTab) {
      case 'account': return <AccountSettings session={session} onClose={onClose} />;
      case 'appearance': return <AppearanceSettings />;
      case 'personalization': return <PersonalizationSettings />;
      default: return <AccountSettings session={session} onClose={onClose} />;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-0 md:p-4" aria-modal="true" role="dialog" onClick={onClose}>
        <div className="relative bg-neutral-50 dark:bg-neutral-900 rounded-none md:rounded-2xl shadow-xl w-full h-full md:max-w-5xl md:h-auto md:max-h-[90vh] flex flex-col animate-pop-in" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">{t('settings.title')}</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"> <XIcon className="w-5 h-5" /> </button>
            </header>
            <div className="flex-grow flex flex-col md:flex-row gap-8 p-4 sm:p-6 lg:p-8 overflow-hidden">
                <aside className="md:w-56 flex-shrink-0 overflow-y-auto">
                    <nav><ul className="space-y-1">
                        {navItems.map(item => { const Icon = item.icon, isActive = activeTab === item.id;
                            return ( <li key={item.id}><button onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left rtl:text-right transition-colors ${isActive ? 'bg-brand-600 text-white font-semibold' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}>
                                <Icon className="w-5 h-5"/><span>{item.label}</span>
                            </button></li>)
                        })}
                    </ul></nav>
                </aside>
                <main className="flex-1 min-w-0 overflow-y-auto"> {renderContent()} </main>
            </div>
        </div>
    </div>
  );
};
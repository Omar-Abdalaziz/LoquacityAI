import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Language } from '../types';
import { locales } from '../i18n/locales';

type TranslationKey = keyof typeof locales.en;

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('loquacity-lang') as Language | null;
      if (savedLang && ['en', 'ar'].includes(savedLang)) {
        return savedLang;
      }
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if(browserLang === 'ar') return 'ar';
    }
    return 'en';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('loquacity-lang', language);
  }, [language]);
  
  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: any = locales[language];
    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
            // Fallback to English if key not found in current language
            let fallbackResult: any = locales.en;
            for (const fk of keys) {
                fallbackResult = fallbackResult?.[fk];
            }
            return fallbackResult || key;
        }
    }
    return result || key;
  }, [language]);

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

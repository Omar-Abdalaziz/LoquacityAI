import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Language } from '../types';
import { locales } from '../i18n/locales';

type TranslationKey = keyof typeof locales.en;

interface LocalizationContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  // FIX: Updated `t` function signature to accept an optional `variables` object for string interpolation.
  t: (key: string, variables?: Record<string, string | number>) => string;
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
  
  // FIX: Updated `t` function to handle variable substitution (e.g., {count}).
  const t = useCallback((key: string, variables?: Record<string, string | number>): string => {
    const keys = key.split('.');
    
    const getValue = (locale: any) => {
      let value = locale;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) return undefined;
      }
      return value;
    };
    
    let translation = getValue(locales[language]);

    if (translation === undefined) {
      translation = getValue(locales.en);
    }

    let result = translation || key;

    if (typeof result === 'string' && variables) {
      Object.keys(variables).forEach(varKey => {
        const regex = new RegExp(`{${varKey}}`, 'g');
        result = result.replace(regex, String(variables[varKey]));
      });
    }

    return result;
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

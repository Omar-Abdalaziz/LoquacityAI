import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Personalization } from '../types';

interface PersonalizationContextType {
  personalization: Personalization;
  setPersonalization: (personalization: Personalization) => void;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

const defaultState: Personalization = {
  introduction: '',
  location: '',
};

export const PersonalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [personalization, setPersonalizationState] = useState<Personalization>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('loquacity-personalization');
        return saved ? JSON.parse(saved) : defaultState;
      } catch (error) {
        console.error("Failed to parse personalization from localStorage", error);
        return defaultState;
      }
    }
    return defaultState;
  });

  const setPersonalization = (newPersonalization: Personalization) => {
    setPersonalizationState(newPersonalization);
    localStorage.setItem('loquacity-personalization', JSON.stringify(newPersonalization));
  };

  return (
    <PersonalizationContext.Provider value={{ personalization, setPersonalization }}>
      {children}
    </PersonalizationContext.Provider>
  );
};

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};
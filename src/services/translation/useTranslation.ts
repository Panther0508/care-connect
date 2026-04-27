import { useState, useEffect, useMemo } from 'react';
import { translations, LanguageCode, supportedLanguages } from './translations';

const STORAGE_KEY = 'vita_language';

export function useTranslation() {
  // Get stored language or default to English
  const [lang, setLang] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as LanguageCode) || 'en';
  });

  // Translate function
  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const langDict = translations[lang] || translations.en;
      let translation = langDict[key as keyof typeof langDict] || key;
      
      // Simple parameter interpolation
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          translation = translation.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }
      
      return translation;
    };
  }, [lang]);

  // Change language
  const changeLanguage = (newLang: LanguageCode) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    setLang(newLang);
    // Dispatch event for components listening to language change
    window.dispatchEvent(new CustomEvent('language-change', { detail: { language: newLang } }));
  };

  return {
    t,
    lang,
    changeLanguage,
    supportedLanguages,
  };
}

import { useState, useEffect, useMemo } from 'react';
import { useTranslation as useI18n } from 'react-i18next';
import { getSetting, storeSetting } from '../../lib/idb';

const STORAGE_KEY = 'vita_language';

export function useTranslation() {
  const { t, i18n } = useI18n();
  const [lang, setLang] = useState(i18n.language || 'en');

  useEffect(() => {
    // Sync language state when i18next changes
    setLang(i18n.language || 'en');
    // Also ensure our IDB store is in sync
    if (i18n.language) {
      storeSetting(STORAGE_KEY, i18n.language);
    }
  }, [i18n.language]);

  const changeLanguage = async (newLang: string) => {
    await i18n.changeLanguage(newLang);
    // Explicitly store in IDB for consistency
    await storeSetting(STORAGE_KEY, newLang);
  };

  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ha', name: 'Hausa' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
    { code: 'sw', name: 'Swahili' },
  ];

  return {
    t,
    lang,
    changeLanguage,
    supportedLanguages,
  };
}

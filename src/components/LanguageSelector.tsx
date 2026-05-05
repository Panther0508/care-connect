import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useStatus } from '../hooks/useStatus';
import { getSetting, storeSetting } from '../lib/idb';

export default function LanguageSelector() {
  const { showStatus } = useStatus();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [saving, setSaving] = useState(false);

  // Load preferred language from IDB on mount
  useEffect(() => {
    getSetting<string>('preferredLanguage').then(lang => {
      if (lang) setSelectedLanguage(lang);
    });
  }, []);

  // Supported languages with their display names
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'sw', name: 'Swahili' },
    { code: 'yo', name: 'Yorùbá' },
    { code: 'ig', name: 'Igbo' },
    { code: 'ha', name: 'Hausa' },
    { code: 'yor', name: 'Yoruba' },
    { code: 'swa', name: 'Kiswahili' },
  ];

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await storeSetting('preferredLanguage', selectedLanguage);
      // Trigger language change event for any listeners
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: selectedLanguage } }));
      showStatus('success', 'Language Updated', `Language changed to ${languages.find(l => l.code === selectedLanguage)?.name || selectedLanguage}`);
      // Also update i18n if available
      if ((window as any).i18n) {
        (window as any).i18n.changeLanguage(selectedLanguage);
      }
    } catch (err) {
      console.error(err);
      showStatus('error', 'Update Failed', 'Could not save language preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Globe size={24} className="text-teal-400" />
        <h3 className="text-lg font-semibold text-white">Select Your Language</h3>
      </div>

      <p className="text-slate-400 text-sm">
        Choose your preferred language. The app will use this language for all menus, messages, and translations.
      </p>

      {/* Language Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
              selectedLanguage === lang.code
                ? 'bg-teal-600/30 border-teal-500 text-teal-200'
                : 'bg-slate-800/40 border-slate-700/30 text-slate-300 hover:border-slate-600'
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>

      {/* Language Info Box */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mt-6">
        <h4 className="font-medium text-white mb-2">Current Selection</h4>
        <p className="text-slate-300">
          Language: <span className="font-semibold text-teal-300">
            {languages.find(l => l.code === selectedLanguage)?.name || selectedLanguage}
          </span>
        </p>
        <p className="text-xs text-slate-500 mt-2">
          AI responses, clinical summaries, and interface labels will be provided in this language when possible.
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors mt-6 w-full"
      >
        {saving ? 'Saving...' : 'Save Language Preference'}
      </button>

      {/* Auto-translate Disclaimer */}
      <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-700/30 mt-4">
        <p className="text-xs text-amber-200">
          ℹ️ <span className="font-medium">Note:</span> Some content may be provided in English if translations are not yet available. We're continuously expanding language support.
        </p>
      </div>
    </div>
  );
}

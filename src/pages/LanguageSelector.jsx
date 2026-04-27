import { useTranslation } from '../services/translation/useTranslation';
import { motion } from 'framer-motion';

export default function LanguageSelector() {
  const { t, lang, changeLanguage, supportedLanguages } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Language</h1>
        <p className="text-slate-400">Select your preferred language for the app interface.</p>
      </div>

      <div className="grid gap-3">
        {supportedLanguages.map((language) => (
          <motion.button
            key={language.code}
            whileHover={{ scale: 1.01 }}
            onClick={() => changeLanguage(language.code)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              lang === language.code
                ? 'border-teal-500 bg-teal-900/30'
                : 'border-slate-600 bg-slate-800/40 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{language.flag}</span>
                <div>
                  <div className="font-semibold text-white">{language.nativeName}</div>
                  <div className="text-sm text-slate-400">{language.name}</div>
                </div>
              </div>
              {lang === language.code && (
                <div className="text-teal-400 text-xl">✓</div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="bg-slate-800/40 p-4 rounded-lg text-xs text-slate-400">
        <strong>Note:</strong> Some languages require an internet connection for translation.
        Hausa, Igbo, Yoruba, Swahili, and other African languages work completely offline.
      </div>
    </motion.div>
  );
}

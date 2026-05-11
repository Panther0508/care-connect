import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "../services/translation/useTranslation";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
];

export default function LanguageSelector() {
  const { t, lang, changeLanguage } = useTranslation();
  const [selected, setSelected] = useState(lang);

  const handleSelect = async (code: string) => {
    setSelected(code);
    await changeLanguage(code);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <Globe className="text-teal-400" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Language</h1>
            <p className="text-slate-400 text-sm">Choose your preferred language</p>
          </div>
        </div>

        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full glass-card p-4 flex items-center justify-between transition-all ${
                selected === lang.code ? "border-teal-500/40 bg-teal-500/10" : "hover:border-teal-500/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-medium text-white">{lang.name}</p>
                  <p className="text-xs text-slate-400">
                    {lang.code === "en" ? "English" : lang.code === "ha" ? "Hausa" : lang.code === "yo" ? "Yoruba" : lang.code === "ig" ? "Igbo" : "Swahili"}
                  </p>
                </div>
              </div>
              {selected === lang.code && <Check className="text-teal-400" size={20} />}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 mt-6 text-center">
          Changing language will affect app text and AI responses where available.
          More languages coming soon.
        </p>
      </div>
    </motion.div>
  );
}

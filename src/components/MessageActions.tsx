import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Volume2, Globe, MoreHorizontal } from "lucide-react";
import { useTranslation } from "@/services/translation/useTranslation";
import { speakText, isSpeaking, cancelSpeech } from "@/services/ttsService";
import { translateText } from "@/services/translationService";

interface MessageActionsProps {
  content: string;
  onTranslate?: (translated: string) => void;
}

export default function MessageActions({ content, onTranslate }: MessageActionsProps) {
  const { t, lang } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [translating, setTranslating] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSpeak = async () => {
    if (speaking) {
      cancelSpeech();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      try {
        await speakText(content, { language: lang === 'ha' ? 'ha-NG' : lang === 'yo' ? 'yo-NG' : lang === 'ig' ? 'ig-NG' : 'en-US' });
      } catch (err) {
        console.error('TTS failed:', err);
      }
      setSpeaking(false);
    }
  };

  const handleTranslate = async () => {
    if (translating) return;
    setTranslating(true);
    try {
      const translated = await translateText(content, lang, 'en');
      if (onTranslate) {
        onTranslate(translated);
      } else {
        // Show translated text in a toast or modal
        console.log('Translated:', translated);
      }
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Message actions"
      >
        <MoreHorizontal size={14} />
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl shadow-xl border border-white/10 overflow-hidden z-50"
            >
              <button
                onClick={() => { handleCopy(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-sm text-slate-200"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} className="text-slate-400" />
                    Copy text
                  </>
                )}
              </button>

              <button
                onClick={() => { handleSpeak(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-sm text-slate-200"
              >
                {speaking ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                    Speaking...
                  </>
                ) : (
                  <>
                    <Volume2 size={16} className="text-slate-400" />
                    Read aloud
                  </>
                )}
              </button>

              <button
                onClick={() => { handleTranslate(); setShowMenu(false); }}
                disabled={translating}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-sm text-slate-200 disabled:opacity-50"
              >
                {translating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Globe size={16} className="text-slate-400" />
                    Translate to English
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

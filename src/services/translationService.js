// src/services/translationService.js
// Offline translation service using NLLB-200 and OPUS-MT fallback
// Supports 200+ languages with FLORES-200 code mapping

import { openDB } from '../lib/idb';
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = true;
env.useBrowserCache = true;

let translator = null;
let translatorLoading = false;
let translatorLoaded = false;
let translatorError = null;

// FLORES-200 language codes mapping (ISO 639-3 to BCP-47 compatible)
const FLORES_LANGUAGES = {
  // Major languages supported by NLLB-200
  'eng': 'eng_Latn',      // English
  'fra': 'fra_Latn',      // French
  'spa': 'spa_Latn',      // Spanish
  'por': 'por_Latn',      // Portuguese
  'deu': 'deu_Latn',      // German
  'ita': 'ita_Latn',      // Italian
  'nld': 'nld_Latn',      // Dutch
  'pol': 'pol_Latn',      // Polish
  'rus': 'rus_Cyrl',      // Russian
  'ukr': 'ukr_Cyrl',      // Ukrainian
  'ara': 'ara_Arab',      // Arabic
  'tur': 'tur_Latn',      // Turkish
  'hin': 'hin_Deva',      // Hindi
  'urd': 'urd_Arab',      // Urdu
  'ben': 'ben_Beng',      // Bengali
  'tam': 'tam_Taml',      // Tamil
  'tel': 'tel_Telu',      // Telugu
  'mar': 'mar_Deva',      // Marathi
  'guj': 'guj_Gujr',      // Gujarati
  'kan': 'kan_Knda',      // Kannada
  'mal': 'mal_Mlym',      // Malayalam
  'ori': 'ori_Orya',      // Oriya
  'pan': 'pan_Guru',      // Punjabi
  'sin': 'sin_Sinh',      // Sinhala
  'khm': 'khm_Khmr',      // Khmer
  'lao': 'lao_Laoo',      // Lao
  'mya': 'mya_Mymr',      // Burmese
  'tha': 'tha_Thai',      // Thai
  'vie': 'vie_Latn',      // Vietnamese
  'ind': 'ind_Latn',      // Indonesian
  'jav': 'jav_Latn',      // Javanese
  'zho': 'zho_Hans',      // Chinese (Simplified)
  'zho_TW': 'zho_Hant',   // Chinese (Traditional)
  'jpn': 'jpn_Jpan',      // Japanese
  'kor': 'kor_Hang',      // Korean
  'hau': 'hau_Latn',      // Hausa
  'ibo': 'ibo_Latn',      // Igbo
  'yor': 'yor_Latn',      // Yoruba
  'som': 'som_Latn',      // Somali
  'amh': 'amh_Ethi',      // Amharic
  'swa': 'swa_Latn',      // Swahili
  'kin': 'kin_Latn',      // Kinyarwanda
  'lug': 'lug_Latn',      // Ganda
  'sna': 'sna_Latn',      // Shona
  'nya': 'nya_Latn',      // Nyanja
  'wol': 'wol_Latn',      // Wolof
  'bam': 'bam_Latn',      // Bambara
  'fon': 'fon_Latn',      // Fon
  'ewe': 'ewe_Latn',      // Ewe
  'twi': 'twi_Latn',      // Twi
  'aka': 'aka_Latn',      // Akan
  'nep': 'nep_Deva',      // Nepali
  'sin': 'sin_Sinh',      // Sinhala
  'mya': 'mya_Mymr',      // Burmese
  'tgl': 'tgl_Latn',      // Tagalog
  'ceb': 'ceb_Latn',      // Cebuano
  'tir': 'tir_Ethi',      // Tigrinya
  'afr': 'afr_Latn',      // Afrikaans
  'sot': 'sot_Latn',      // Southern Sotho
  'tsn': 'tsn_Latn',      // Tswana
  'ssw': 'ssw_Latn',      // Swazi
  'ven': 'ven_Latn',      // Venda
  'xho': 'xho_Latn',      // Xhosa
  'zul': 'zul_Latn',      // Zulu
  'mlg': 'mlg_Latn',      // Malagasy
  'hat': 'hat_Latn',      // Haitian Creole
  'run': 'run_Latn',      // Kirundi
  'sag': 'sag_Latn',      // Sango
  'grn': 'grn_Latn',      // Guarani
  'que': 'que_Latn',      // Quechua
  'aym': 'aym_Latn',      // Aymara
  'bod': 'bod_Tibt',      // Tibetan
  'khb': 'khb_Talu',      // Lue
  'mri': 'mri_Latn',      // Maori
  'smo': 'smo_Latn',      // Samoan
  'ton': 'ton_Latn',      // Tongan
  'fij': 'fij_Latn',      // Fijian
  'gil': 'gil_Latn',      // Gilbertese
  'tuv': 'tuv_Latn',      // Tuvalu
  'nau': 'nau_Latn',      // Nauru
  'bis': 'bis_Latn',      // Bislama
};

// OPUS-MT language codes (fallback)
const OPUS_LANGUAGES = {
  'af': 'afr', 'am': 'amh', 'ar': 'ara', 'as': 'asm', 'az': 'aze',
  'be': 'bel', 'bg': 'bul', 'bn': 'ben', 'br': 'bre', 'bs': 'bos',
  'ca': 'cat', 'cs': 'ces', 'cy': 'cym', 'da': 'dan', 'de': 'deu',
  'el': 'ell', 'en': 'eng', 'eo': 'epo', 'es': 'spa', 'et': 'est',
  'eu': 'eus', 'fa': 'fas', 'fi': 'fin', 'fr': 'fra', 'ga': 'gle',
  'gd': 'gla', 'gl': 'glg', 'gu': 'guj', 'ha': 'hau', 'he': 'heb',
  'hi': 'hin', 'hr': 'hrv', 'hu': 'hun', 'hy': 'hun', 'id': 'ind',
  'is': 'isl', 'it': 'ita', 'ja': 'jpn', 'jv': 'jav', 'ka': 'kat',
  'kk': 'kaz', 'km': 'khm', 'kn': 'kan', 'ko': 'kor', 'ku': 'kur',
  'ky': 'kir', 'ln': 'lin', 'lo': 'lao', 'lt': 'lit', 'lv': 'lvs',
  'mag': 'mag', 'mai': 'mai', 'mk': 'mkd', 'ml': 'mal', 'mn': 'mon',
  'mr': 'mar', 'ms': 'msa', 'mt': 'mlt', 'my': 'mya', 'ne': 'nep',
  'nl': 'nld', 'no': 'nor', 'om': 'orm', 'or': 'ory', 'pa': 'pan',
  'pl': 'pol', 'ps': 'pus', 'pt': 'por', 'ro': 'ron', 'ru': 'rus',
  'sa': 'san', 'sd': 'snd', 'si': 'sin', 'sk': 'slk', 'sl': 'slv',
  'so': 'som', 'sq': 'sqi', 'sr': 'srp', 'su': 'sun', 'sv': 'swe',
  'sw': 'swa', 'ta': 'tam', 'te': 'tel', 'th': 'tha', 'tl': 'tgl',
  'tr': 'tur', 'ug': 'uig', 'uk': 'ukr', 'ur': 'urd', 'uz': 'uzb',
  'vi': 'vie', 'xh': 'xho', 'yi': 'yid', 'yo': 'yor', 'zh': 'zho',
  'zu': 'zul',
};

/**
 * Normalize language code to FLORES-200 format
 */
function normalizeLanguageCode(langCode) {
  if (!langCode) return 'eng_Latn';
  
  const code = langCode.toLowerCase().trim();
  
  // Direct FLORES format
  if (FLORES_LANGUAGES[code]) {
    return FLORES_LANGUAGES[code];
  }
  
  // Try as ISO 639-3
  if (FLORES_LANGUAGES[code]) {
    return FLORES_LANGUAGES[code];
  }
  
  // Try OPUS mapping
  if (OPUS_LANGUAGES[code]) {
    const opusCode = OPUS_LANGUAGES[code];
    // Find FLORES equivalent
    for (const [key, value] of Object.entries(FLORES_LANGUAGES)) {
      if (key.startsWith(opusCode + '_')) {
        return value;
      }
    }
    return opusCode + '_Latn';
  }
  
  // Try combining country/language
  const parts = code.split(/[-_]/);
  if (parts.length >= 2) {
    const lang = parts[0];
    const region = parts[1].toUpperCase();
    const combined = `${lang}_${region}`;
    if (FLORES_LANGUAGES[combined]) {
      return FLORES_LANGUAGES[combined];
    }
  }
  
  return 'eng_Latn'; // Default to English
}

/**
 * Load NLLB-200 translation model
 */
async function loadTranslator() {
  if (translatorLoaded) return translator;
  if (translatorLoading) {
    while (translatorLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (translatorError) throw translatorError;
    return translator;
  }

  translatorLoading = true;
  try {
    translator = await pipeline('translation', 'facebook/nllb-200-distilled-600M', {
      progress_callback: (progress) => {
        console.log(`Translator progress: ${Math.round((progress.loaded || 0) / (progress.total || 1) * 100)}%`);
      }
    });
    translatorLoaded = true;
    console.log('✅ Translation model loaded (NLLB-200)');
  } catch (err) {
    console.error('Failed to load NLLB translator:', err);
    translatorError = err;
    throw err;
  } finally {
    translatorLoading = false;
  }
  return translator;
}

/**
 * Fallback: OPUS-MT translation
 */
async function loadOpusTranslator(srcLang, tgtLang) {
  const opusModel = `Helsinki-NLP/opus-mt-${srcLang}-${tgtLang}`;
  try {
    const opusTrans = await pipeline('translation', opusModel, {
      progress_callback: (progress) => {
        console.log(`OPUS progress: ${Math.round((progress.loaded || 0) / (progress.total || 1) * 100)}%`);
      }
    });
    return opusTrans;
  } catch (err) {
    console.error(`Failed to load OPUS model ${opusModel}:`, err);
    return null;
  }
}

/**
 * Cache operations for translated text
 */
async function getCachedTranslation(text, srcLang, tgtLang) {
  const db = await openIDB();
  return new Promise((resolve) => {
    const tx = db.transaction('translationCache', 'readonly');
    const store = tx.objectStore('translationCache');
    const key = `${srcLang}:${tgtLang}:${text}`;
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.translation || null);
    req.onerror = () => resolve(null);
  });
}

async function cacheTranslation(text, srcLang, tgtLang, translation) {
  const db = await openIDB();
  return new Promise((resolve) => {
    const tx = db.transaction('translationCache', 'readwrite');
    const store = tx.objectStore('translationCache');
    const key = `${srcLang}:${tgtLang}:${text}`;
    store.put({
      key,
      text,
      srcLang,
      tgtLang,
      translation,
      timestamp: Date.now()
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// Need IDB with translation cache store
async function openIDB() {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open('vitachain-translation', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('translationCache')) {
        const store = db.createObjectStore('translationCache', { keyPath: 'key' });
        store.createIndex('byLanguages', ['srcLang', 'tgtLang'], { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return idbPromise;
}

/**
 * Main translation function with NLLB-200 + OPUS-MT fallback
 */
export async function translateText(text, sourceLanguage, targetLanguage) {
  if (!text || !text.trim()) return text;

  const srcLangCode = normalizeLanguageCode(sourceLanguage || 'en');
  const tgtLangCode = normalizeLanguageCode(targetLanguage || 'en');

  if (srcLangCode === tgtLangCode) return text;

  // Check cache
  const cached = await getCachedTranslation(text, srcLangCode, tgtLangCode);
  if (cached) {
    return cached;
  }

  // Try NLLB-200
  try {
    await loadTranslator();
    const result = await translator(text, {
      src_lang: srcLangCode,
      tgt_lang: tgtLangCode
    });
    
    if (result && result[0] && result[0].translation_text) {
      const translation = result[0].translation_text.trim();
      await cacheTranslation(text, srcLangCode, tgtLangCode, translation);
      return translation;
    }
  } catch (err) {
    console.error('NLLB translation failed, trying OPUS-MT fallback:', err);
  }

  // OPUS-MT fallback
  try {
    // Extract base language codes from FLORES format
    const srcBase = srcLangCode.split('_')[0];
    const tgtBase = tgtLangCode.split('_')[0];
    
    const opus = await loadOpusTranslator(srcBase, tgtBase);
    if (opus) {
      const result = await opus(text);
      if (result && result[0] && result[0].translation_text) {
        const translation = result[0].translation_text.trim();
        await cacheTranslation(text, srcLangCode, tgtLangCode, translation);
        return translation;
      }
    }
  } catch (err) {
    console.error('OPUS-MT translation failed:', err);
  }

  return `[Translation not available: ${srcLangCode} → ${tgtLangCode}]`;
}

/**
 * Batch translate multiple texts (for efficiency)
 */
export async function translateBatch(texts, sourceLanguage, targetLanguage) {
  const srcLang = normalizeLanguageCode(sourceLanguage || 'en');
  const tgtLang = normalizeLanguageCode(targetLanguage || 'en');

  // Check cache for all
  const cachedResults = await Promise.all(
    texts.map(t => getCachedTranslation(t, srcLang, tgtLang))
  );

  const uncached = texts.map((t, i) => ({ text: t, index: i, cached: cachedResults[i] }))
    .filter(item => !item.cached);

  if (uncached.length === 0) {
    return cachedResults;
  }

  // Translate uncached items
  try {
    await loadTranslator();
    const toTranslate = uncached.map(u => u.text);
    const results = await translator(toTranslate, {
      src_lang: srcLang,
      tgt_lang: tgtLang
    });

    const allResults = [...cachedResults];
    
    results.forEach((result, i) => {
      if (result && result[0] && result[0].translation_text) {
        const translation = result[0].translation_text.trim();
        const idx = uncached[i].index;
        allResults[idx] = translation;
        cacheTranslation(uncached[i].text, srcLang, tgtLang, translation);
      }
    });

    return allResults;
  } catch (err) {
    console.error('Batch translation failed:', err);
    return cachedResults.map((r, i) => r || texts[i]);
  }
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages() {
  return Object.entries(FLORES_LANGUAGES).map(([code, flores]) => ({
    code,
    floresCode: flores,
    name: code
  }));
}

/**
 * Clean translation cache
 */
export async function clearTranslationCache() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('translationCache', 'readwrite');
    const store = tx.objectStore('translationCache');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get translation cache stats
 */
export async function getTranslationCacheStats() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('translationCache', 'readonly');
    const store = tx.objectStore('translationCache');
    const req = store.count();
    req.onsuccess = () => resolve({ count: req.result });
    req.onerror = () => reject(req.error);
  });
}
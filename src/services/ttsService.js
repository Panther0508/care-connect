// src/services/ttsService.js
// Text-to-Speech service using browser-native SpeechSynthesis API
// Supports 50+ languages with configurable voice, rate, and pitch

let availableVoices = [];
let voicesLoaded = false;

/**
 * Load available voices from the browser
 */
function loadVoices() {
  return new Promise((resolve) => {
    // Voices may be loaded asynchronously
    let attempts = 0;
    const maxAttempts = 10;

    const tryLoad = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        availableVoices = voices;
        voicesLoaded = true;
        resolve(voices);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryLoad, 100);
      } else {
        // Fallback: create synthetic voice list from available languages
        availableVoices = getDefaultVoices();
        voicesLoaded = true;
        resolve(availableVoices);
      }
    };

    tryLoad();

    // Listen for voicechanged event
    window.speechSynthesis.onvoiceschanged = tryLoad;
  });
}

/**
 * Default voice mappings for common languages when browser voices not available
 */
function getDefaultVoices() {
  return [
    { name: 'English (US)', lang: 'en-US', default: true, localService: true },
    { name: 'English (UK)', lang: 'en-GB', default: false, localService: true },
    { name: 'Spanish', lang: 'es-ES', default: false, localService: true },
    { name: 'French', lang: 'fr-FR', default: false, localService: true },
    { name: 'German', lang: 'de-DE', default: false, localService: true },
    { name: 'Italian', lang: 'it-IT', default: false, localService: true },
    { name: 'Portuguese (BR)', lang: 'pt-BR', default: false, localService: true },
    { name: 'Portuguese (PT)', lang: 'pt-PT', default: false, localService: true },
    { name: 'Russian', lang: 'ru-RU', default: false, localService: true },
    { name: 'Chinese (Mandarin)', lang: 'zh-CN', default: false, localService: true },
    { name: 'Japanese', lang: 'ja-JP', default: false, localService: true },
    { name: 'Korean', lang: 'ko-KR', default: false, localService: true },
    { name: 'Hindi', lang: 'hi-IN', default: false, localService: true },
    { name: 'Arabic', lang: 'ar-SA', default: false, localService: true },
    { name: 'Turkish', lang: 'tr-TR', default: false, localService: true },
    { name: 'Polish', lang: 'pl-PL', default: false, localService: true },
    { name: 'Dutch', lang: 'nl-NL', default: false, localService: true },
    { name: 'Swedish', lang: 'sv-SE', default: false, localService: true },
    { name: 'Norwegian', lang: 'no-NO', default: false, localService: true },
    { name: 'Danish', lang: 'da-DK', default: false, localService: true },
    { name: 'Finnish', lang: 'fi-FI', default: false, localService: true },
    { name: 'Greek', lang: 'el-GR', default: false, localService: true },
    { name: 'Czech', lang: 'cs-CZ', default: false, localService: true },
    { name: 'Hungarian', lang: 'hu-HU', default: false, localService: true },
    { name: 'Romanian', lang: 'ro-RO', default: false, localService: true },
    { name: 'Bulgarian', lang: 'bg-BG', default: false, localService: true },
    { name: 'Ukrainian', lang: 'uk-UA', default: false, localService: true },
    { name: 'Croatian', lang: 'hr-HR', default: false, localService: true },
    { name: 'Slovak', lang: 'sk-SK', default: false, localService: true },
    { name: 'Slovenian', lang: 'sl-SI', default: false, localService: true },
    { name: 'Serbian', lang: 'sr-RS', default: false, localService: true },
    { name: 'Indonesian', lang: 'id-ID', default: false, localService: true },
    { name: 'Malay', lang: 'ms-MY', default: false, localService: true },
    { name: 'Thai', lang: 'th-TH', default: false, localService: true },
    { name: 'Vietnamese', lang: 'vi-VN', default: false, localService: true },
    { name: 'Tamil', lang: 'ta-IN', default: false, localService: true },
    { name: 'Telugu', lang: 'te-IN', default: false, localService: true },
    { name: 'Marathi', lang: 'mr-IN', default: false, localService: true },
    { name: 'Gujarati', lang: 'gu-IN', default: false, localService: true },
    { name: 'Bengali', lang: 'bn-IN', default: false, localService: true },
  ];
}

/**
 * Find best voice match for language code
 */
function findVoice(languageCode, options = {}) {
  if (!languageCode) languageCode = 'en-US';
  
  const langLower = languageCode.toLowerCase();

  // Filter voices by language
  const matchingVoices = availableVoices.filter(v => {
    const voiceLang = (v.lang || v.language || '').toLowerCase();
    return voiceLang === langLower || voiceLang.startsWith(langLower.split('-')[0]);
  });

  // If specific gender requested, filter further
  if (options.gender) {
    const genderVoices = matchingVoices.filter(v => {
      const name = (v.name || '').toLowerCase();
      if (options.gender === 'female') return name.includes('female') || name.includes('woman');
      if (options.gender === 'male') return name.includes('male') || name.includes('man');
      return true;
    });
    if (genderVoices.length > 0) {
      return genderVoices[0];
    }
  }

  // Return first match or default
  return matchingVoices[0] || availableVoices[0] || { lang: 'en-US', name: 'Default' };
}

/**
 * Normalize language code to BCP-47 format
 */
function normalizeLanguageCode(code) {
  if (!code) return 'en-US';
  
  const normalized = code.replace('_', '-').toLowerCase();
  
  // Map common language codes
  const mappings = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'ar': 'ar-SA',
    'hi': 'hi-IN',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'ru': 'ru-RU',
    'tr': 'tr-TR',
  };

  if (normalized in mappings) {
    return mappings[normalized];
  }

  // Already has region
  if (normalized.includes('-')) {
    return normalized.toUpperCase();
  }

  return normalized + '-' + normalized.toUpperCase();
}

/**
 * Speak text aloud
 */
export async function speakText(text, options = {}) {
  if (!text || !text.trim()) {
    return { success: false, error: 'No text provided' };
  }

  if (!window.speechSynthesis) {
    return { success: false, error: 'Speech synthesis not supported' };
  }

  // Cancel any ongoing speech
  if (options.cancelOnNew) {
    cancelSpeech();
  }

  // Ensure voices are loaded
  if (!voicesLoaded) {
    await loadVoices();
  }

  const languageCode = normalizeLanguageCode(options.language || 'en');
  const voice = findVoice(languageCode, options);

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Configure utterance
  utterance.voice = voice;
  utterance.lang = languageCode;
  utterance.volume = Math.max(0, Math.min(1, options.volume || 1));
  utterance.rate = Math.max(0.5, Math.min(2, options.rate || 1.1));
  utterance.pitch = Math.max(0, Math.min(2, options.pitch || 1));

  return new Promise((resolve) => {
    // Event handlers
    utterance.onstart = () => {
      if (options.onStart) options.onStart();
      resolve({ success: true, state: 'started' });
    };

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      if (options.onError) options.onError(event.error);
      resolve({ success: false, error: event.error });
    };

    utterance.onpause = () => {
      if (options.onPause) options.onPause();
    };

    utterance.onresume = () => {
      if (options.onResume) options.onResume();
    };

    utterance.onboundary = (event) => {
      if (options.onBoundary) options.onBoundary(event);
    };

    utterance.onmark = (event) => {
      if (options.onMark) options.onMark(event);
    };

    // Speak
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis failed:', err);
      resolve({ success: false, error: err.message });
    }
  });
}

/**
 * Pause ongoing speech
 */
export function pauseSpeech() {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    return true;
  }
  return false;
}

/**
 * Resume paused speech
 */
export function resumeSpeech() {
  if (window.speechSynthesis && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    return true;
  }
  return false;
}

/**
 * Cancel ongoing speech
 */
export function cancelSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    return true;
  }
  return false;
}

/**
 * Check if speech is currently active
 */
export function isSpeaking() {
  return window.speechSynthesis && window.speechSynthesis.speaking;
}

/**
 * Check if speech is paused
 */
export function isPaused() {
  return window.speechSynthesis && window.speechSynthesis.paused;
}

/**
 * Check if speech synthesis is supported
 */
export function isTTSSupported() {
  return !!(window.speechSynthesis && SpeechSynthesisUtterance);
}

/**
 * Get list of available voices
 */
export async function getAvailableVoices() {
  if (!voicesLoaded) {
    await loadVoices();
  }
  return availableVoices.map(v => ({
    name: v.name,
    lang: v.lang,
    localService: v.localService,
    default: v.default
  }));
}

/**
 * Get available languages
 */
export async function getSupportedLanguages() {
  if (!voicesLoaded) {
    await loadVoices();
  }
  
  const languages = new Set();
  availableVoices.forEach(v => {
    if (v.lang) {
      languages.add(v.lang);
    }
  });

  return Array.from(languages).sort();
}

/**
 * Speak medication instruction
 */
export async function speakMedicationInstruction(medication, options = {}) {
  const instruction = `${medication.name}. Take ${medication.dose || 'one tablet'} ${medication.frequency || 'daily'}. ${medication.notes || ''}`;
  
  return speakText(instruction, {
    rate: 0.9, // Slower for clarity
    pitch: 1,
    volume: options.volume || 0.9,
    language: options.language || 'en',
    cancelOnNew: true,
    ...options
  });
}

/**
 * Speak appointment reminder
 */
export async function speakAppointmentReminder(appointment, options = {}) {
  const message = `You have an appointment with ${appointment.specialist || 'your doctor'} on ${appointment.date} at ${appointment.time}. ${appointment.notes || ''}`;
  
  return speakText(message, {
    rate: 1,
    pitch: 1.1,
    volume: options.volume || 1,
    language: options.language || 'en',
    cancelOnNew: true,
    ...options
  });
}

/**
 * Speak emergency message
 */
export async function speakEmergencyMessage(message, options = {}) {
  return speakText(message, {
    rate: 0.8, // Very clear and slow
    pitch: 1,
    volume: 1,
    language: options.language || 'en',
    cancelOnNew: true,
    ...options
  });
}

/**
 * Get TTS status
 */
export function getTTSStatus() {
  return {
    supported: isTTSSupported(),
    speaking: isSpeaking(),
    paused: isPaused(),
    voicesLoaded,
    voiceCount: availableVoices.length
  };
}

// Auto-load voices on import (optional)
// Note: We don't auto-load to avoid blocking - voices are loaded on first use

// src/services/speechService.js
// Speech-to-text service with Whisper-tiny (offline) and Web Speech API (fallback)

import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = true;
env.useBrowserCache = true;

let whisperModel = null;
let whisperLoading = false;
let whisperLoaded = false;
let whisperError = null;

const audioContext = null;
let mediaRecorder = null;
let audioChunks = [];

/**
 * Load Whisper-tiny model
 */
async function loadWhisper() {
  if (whisperLoaded) return whisperModel;
  if (whisperLoading) {
    while (whisperLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (whisperError) throw whisperError;
    return whisperModel;
  }

  whisperLoading = true;
  try {
    whisperModel = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      progress_callback: (progress) => {
        console.log(`Whisper progress: ${Math.round((progress.loaded || 0) / (progress.total || 1) * 100)}%`);
      }
    });
    whisperLoaded = true;
    console.log('✅ Whisper-tiny model loaded');
  } catch (err) {
    console.error('Failed to load Whisper model:', err);
    whisperError = err;
    throw err;
  } finally {
    whisperLoading = false;
  }
  return whisperModel;
}

/**
 * Check if Web Speech API is available
 */
function isWebSpeechApiAvailable() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Languages supported by Whisper
 */
const WHISPER_LANGUAGES = {
  'en': 'English',
  'zh': 'Chinese',
  'de': 'German',
  'es': 'Spanish',
  'ru': 'Russian',
  'ko': 'Korean',
  'fr': 'French',
  'ja': 'Japanese',
  'pt': 'Portuguese',
  'tr': 'Turkish',
  'pl': 'Polish',
  'ca': 'Catalan',
  'nl': 'Dutch',
  'ar': 'Arabic',
  'sv': 'Swedish',
  'it': 'Italian',
  'id': 'Indonesian',
  'hi': 'Hindi',
  'fi': 'Finnish',
  'vi': 'Vietnamese',
  'he': 'Hebrew',
  'uk': 'Ukrainian',
  'el': 'Greek',
  'ms': 'Malay',
  'cs': 'Czech',
  'ro': 'Romanian',
  'da': 'Danish',
  'hu': 'Hungarian',
  'ta': 'Tamil',
  'no': 'Norwegian',
  'th': 'Thai',
  'ur': 'Urdu',
  'hr': 'Croatian',
  'bg': 'Bulgarian',
  'lt': 'Lithuanian',
  'la': 'Latin',
  'mi': 'Maori',
  'ml': 'Malayalam',
  'cy': 'Welsh',
  'sk': 'Slovak',
  'te': 'Telugu',
  'fa': 'Persian',
  'lv': 'Latvian',
  'bn': 'Bengali',
  'sr': 'Serbian',
  'az': 'Azerbaijani',
  'sl': 'Slovenian',
  'kn': 'Kannada',
  'et': 'Estonian',
  'mk': 'Macedonian',
  'br': 'Breton',
  'eu': 'Basque',
  'is': 'Icelandic',
  'hy': 'Armenian',
  'ne': 'Nepali',
  'mn': 'Mongolian',
  'bs': 'Bosnian',
  'kk': 'Kazakh',
  'sq': 'Albanian',
  'sw': 'Swahili',
  'gl': 'Galician',
  'mr': 'Marathi',
  'pa': 'Punjabi',
  'si': 'Sinhala',
  'km': 'Khmer',
  'sn': 'Shona',
  'yo': 'Yoruba',
  'so': 'Somali',
  'af': 'Afrikaans',
  'oc': 'Occitan',
  'ka': 'Georgian',
  'be': 'Belarusian',
  'tg': 'Tajik',
  'sd': 'Sindhi',
  'gu': 'Gujarati',
  'am': 'Amharic',
  'yi': 'Yiddish',
  'lo': 'Lao',
  'uz': 'Uzbek',
  'fo': 'Faroese',
  'ht': 'Haitian Creole',
  'ps': 'Pashto',
  'tk': 'Turkmen',
  'nn': 'Norwegian Nynorsk',
  'mt': 'Maltese',
  'sa': 'Sanskrit',
  'lb': 'Luxembourgish',
  'my': 'Myanmar',
  'bo': 'Tibetan',
  'tl': 'Tagalog',
  'mg': 'Malagasy',
  'as': 'Assamese',
  'tt': 'Tatar',
  'haw': 'Hawaiian',
  'ln': 'Lingala',
  'ha': 'Hausa',
  'ba': 'Bashkir',
  'jw': 'Javanese',
  'su': 'Sundanese',
};

/**
 * Map language code to Whisper language token
 */
function mapToWhisperLanguage(langCode) {
  if (!langCode) return 'en';
  const code = langCode.toLowerCase().split(/[-_]/)[0];
  return WHISPER_LANGUAGES[code] ? code : 'en';
}

/**
 * Transcribe audio using Whisper-tiny (offline)
 * @param {Blob} audioBlob - Audio recording as blob
 * @param {string} language - Optional language code (auto if not specified)
 * @returns {Promise<{text: string, language: string, duration: number}>}
 */
export async function transcribeWithWhisper(audioBlob, language = 'auto') {
  try {
    await loadWhisper();

    const whisperLanguage = language === 'auto' ? null : mapToWhisperLanguage(language);
    
    const result = await whisperModel(audioBlob, {
      language: whisperLanguage,
      task: 'transcribe',
      chunk_length_s: 30,
    });

    return {
      text: result.text.trim(),
      language: result.language || language,
      duration: result.chunks ? result.chunks.reduce((acc, c) => acc + (c.timestamp[1] - c.timestamp[0]), 0) : 0
    };
  } catch (err) {
    console.error('Whisper transcription failed:', err);
    throw new Error('Whisper transcription failed: ' + err.message);
  }
}

/**
 * Web Speech API transcription (fallback)
 */
export function transcribeWithWebSpeech(language = 'en-US') {
  return new Promise((resolve, reject) => {
    if (!isWebSpeechApiAvailable()) {
      reject(new Error('Web Speech API not available'));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve({
        text: transcript.trim(),
        language: language,
        duration: 0
      });
    };

    recognition.onerror = (event) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        cleanupRecording();
      }
    };

    recognition.start();
  });
}

/**
 * Start audio recording
 */
export async function startRecording(onDataAvailable = null) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: { 
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      } 
    });

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 16000
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        if (onDataAvailable) {
          onDataAvailable(event.data);
        }
      }
    };

    mediaRecorder.start(100); // Collect data every 100ms
    return stream;
  } catch (err) {
    console.error('Failed to start recording:', err);
    throw new Error('Microphone access denied: ' + err.message);
  }
}

/**
 * Stop audio recording and return blob
 */
export function stopRecording() {
  if (!mediaRecorder) {
    return null;
  }

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      cleanupRecording();
      resolve(audioBlob);
    };
    mediaRecorder.stop();
  });
}

/**
 * Stop ongoing recording
 */
export function cancelRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  cleanupRecording();
}

/**
 * Clean up recording resources
 */
function cleanupRecording() {
  if (mediaRecorder && mediaRecorder.stream) {
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  mediaRecorder = null;
  audioChunks = [];
}

/**
 * Main transcription interface - tries Whisper first, falls back to Web Speech
 */
export async function transcribeAudio(audioBlob, language = 'auto', options = {}) {  
  const useWebSpeechFallback = options.forceWebSpeech || !whisperLoaded;

  if (useWebSpeechFallback) {
    const webLang = mapToWhisperLanguage(language) + '-' + (language === 'en' ? 'US' : 'GB');
    try {
      return await transcribeWithWebSpeech(webLang);
    } catch (err) {
      throw new Error('All transcription methods failed: ' + err.message);
    }
  }

  try {
    return await transcribeWithWhisper(audioBlob, language);
  } catch (err) {
    // If Whisper fails, try Web Speech as fallback
    if (options.allowFallback) {
      const webLang = mapToWhisperLanguage(language) + '-' + (language === 'en' ? 'US' : 'GB');
      try {
        return await transcribeWithWebSpeech(webLang);
      } catch (fallbackErr) {
        throw new Error('Transcription failed: ' + err.message);
      }
    }
    throw err;
  }
}

/**
 * Transcribe from mic input with real-time feedback
 */
export async function transcribeFromMic(options = {}) {
  const { language = 'auto', onProgress, minDuration = 1000 } = options;
  
  let startTime = Date.now();
  let recordedBlob = null;

  try {
    // Start recording
    await startRecording();

    // Record for minimum duration, then wait for silence
    await new Promise((resolve, reject) => {
      let silenceTimer = null;
      let lastDataTime = Date.now();

      const checkSilence = () => {
        if (Date.now() - lastDataTime > 1500) { // 1.5s silence
          if (Date.now() - startTime >= minDuration) {
            clearTimeout(silenceTimer);
            resolve();
          }
        }
      };

      silenceTimer = setInterval(checkSilence, 200);

      // For onProgress callback to monitor VU meter
      if (onProgress) {
        const progressInterval = setInterval(() => {
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            const elapsed = Date.now() - startTime;
            onProgress({ elapsed, state: 'recording' });
          }
        }, 100);
      }

      // Stop after max duration
      setTimeout(() => {
        clearTimeout(silenceTimer);
        resolve();
      }, options.maxDuration || 30000);
    });

    // Get the recorded audio
    recordedBlob = await stopRecording();

    if (!recordedBlob || recordedBlob.size < 100) {
      throw new Error('Recording too short');
    }

    // Transcribe
    const result = await transcribeAudio(recordedBlob, language, { allowFallback: true });

    return {
      ...result,
      audioBlob: recordedBlob,
      duration: Date.now() - startTime
    };
  } catch (err) {
    cancelRecording();
    throw err;
  }
}

/**
 * Get available languages for transcription
 */
export function getSupportedLanguages() {
  return Object.entries(WHISPER_LANGUAGES).map(([code, name]) => ({
    code,
    name
  }));
}

/**
 * Check if Whisper model is loaded
 */
export function isWhisperLoaded() {
  return whisperLoaded;
}

/**
 * Clear Whisper model from memory
 */
export function unloadWhisper() {
  whisperModel = null;
  whisperLoaded = false;
  whisperError = null;
  whisperLoading = false;
}

/**
 * Get Whisper loading status
 */
export function getWhisperStatus() {
  if (whisperLoaded) return { loaded: true, loading: false, error: null };
  if (whisperError) return { loaded: false, loading: false, error: whisperError.message };
  return { loaded: false, loading: whisperLoading, error: null };
}
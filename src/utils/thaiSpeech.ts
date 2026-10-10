/**
 * Browser TTS helper for Thai pronunciation (th-TH).
 * Falls back smoothly if Thai voice is unavailable on the client device.
 */
export function playThaiAudio(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 0.85; // slightly slower for better pedagogical clarity
    utterance.pitch = 1.0;

    // Try to match an available Thai voice
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((v) => v.lang.startsWith('th') || v.lang.includes('TH'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
    return false;
  }
}

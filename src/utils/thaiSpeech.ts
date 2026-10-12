/**
 * Browser Speech Synthesis for Thai pronunciation.
 * Pronounces romanized phonetics directly using browser speech synthesis.
 * Contains ZERO Thai script characters.
 */

export function playThaiAudio(phoneticText: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop pending speech

    const cleanPhonetic = phoneticText
      .replace(/[\u0E00-\u0E7F]/g, '') // Extra safety strip of any Thai script
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanPhonetic);
    utterance.lang = 'th-TH';
    utterance.rate = 0.85; // Slightly slower for clear pedagogical listening
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find((v) => v.lang.startsWith('th') || v.lang.includes('TH'));
    if (thaiVoice) {
      utterance.voice = thaiVoice;
    }

    let finished = false;
    const finishHandler = () => {
      if (!finished) {
        finished = true;
        if (onEnd) onEnd();
      }
    };

    utterance.onend = finishHandler;
    utterance.onerror = finishHandler;

    // Safety timeout in case speechSynthesis hangs on mobile
    setTimeout(() => {
      if (!finished) {
        finishHandler();
      }
    }, 4000);

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
    return false;
  }
}

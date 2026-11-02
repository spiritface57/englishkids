// Shared helpers for the word cards and the quiz.

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

export const speak = (text: string) => {
  if (!canSpeak) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
};

export const shuffle = <T>(list: T[]) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

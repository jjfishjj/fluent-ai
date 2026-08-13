/** Speaks a phrase for listening gates, if the browser can. */
export function speakPhrase(text: string, lang: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    /* speech is a bonus; a silent listening gate still shows the romanisation */
  }
}

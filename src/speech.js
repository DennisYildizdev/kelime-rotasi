// Browser boundary: select a real SpeechSynthesisVoice, never lang-only fallback.
// API references and voice/offline limitations: docs/content-notes.md.
const VOICE_WAIT_MS = 1500;

export function createSpeechController({ notify = () => {}, onStatus = () => {} } = {}) {
  const synth = globalThis.speechSynthesis;
  const Utterance = globalThis.SpeechSynthesisUtterance;
  let active = null;
  let disposed = false;
  const offline = () => globalThis.navigator?.onLine === false;

  function getVoices(lang = 'en-US') {
    try {
      return Array.from(synth?.getVoices() || [])
        .filter(voice => typeof voice.lang === 'string' && voice.lang.toLowerCase() === lang.toLowerCase())
        .sort((a, b) => Number(b.localService === true) - Number(a.localService === true)
          || Number(b.default === true) - Number(a.default === true));
    } catch { return []; }
  }
  const pickVoice = lang => getVoices(lang).find(voice => !offline() || voice.localService === true);
  const result = (ok, reason, lang, voiceName = '') => ({ ok, reason, voiceName, lang });
  function status(type, message, lang, voiceName = '') {
    onStatus({ type, message, lang, voiceName });
  }
  function failure(reason, message, lang, voiceName = '', silent = false) {
    if (!silent) notify(message);
    status('error', message, lang, voiceName);
    return result(false, reason, lang, voiceName);
  }
  function cancel() {
    const previous = active;
    active = null; // Invalidate before platform.cancel can fire synchronous events.
    if (previous) {
      previous.cancelled = true;
      previous.stopWaiting?.();
      previous.finish?.(result(false, 'cancelled', previous.lang, previous.voiceName));
    }
    try { synth?.cancel(); } catch { /* Cancellation is best-effort on a broken engine. */ }
  }
  function waitForVoice(request) {
    const ready = pickVoice(request.lang);
    if (ready) return Promise.resolve(ready);
    return new Promise(resolve => {
      let done = false;
      let timer;
      const finish = voice => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        synth.removeEventListener?.('voiceschanged', changed);
        request.stopWaiting = null;
        resolve(voice);
      };
      const changed = () => {
        const voice = pickVoice(request.lang);
        if (voice) finish(voice);
      };
      request.stopWaiting = () => finish(undefined);
      timer = setTimeout(() => finish(pickVoice(request.lang)), VOICE_WAIT_MS);
      synth.addEventListener?.('voiceschanged', changed);
      changed(); // Close the gap between the initial query and listener registration.
    });
  }
  async function speak(text, { lang = 'en-US', rate = 0.85, enabled = true } = {}) {
    if (disposed) return result(false, 'disposed', lang);
    cancel();
    if (!enabled) return failure('disabled', 'Ses kapalı.', lang, '', true);
    if (!synth || typeof synth.speak !== 'function' || typeof Utterance !== 'function') return failure('unsupported', 'Bu tarayıcı sesli okumayı desteklemiyor. Metinle devam edebilirsin.', lang);
    if (typeof text !== 'string' || !text.trim()) return failure('invalid-text', 'Okunacak metin bulunamadı.', lang);
    if (!['en-US', 'en-GB'].includes(lang)) return failure('unsupported-accent', 'Yalnızca en-US veya en-GB aksanı seçilebilir.', lang);
    const request = { lang, voiceName: '', cancelled: false };
    active = request;
    const voice = await waitForVoice(request);
    if (request.cancelled || active !== request) return result(false, 'cancelled', lang);
    if (!voice) {
      active = null;
      return offline()
        ? failure('offline-voice-unavailable', `Çevrimdışıyken ${lang} için yerel ses bulunamadı. Metinle devam edebilirsin.`, lang)
        : failure('voice-unavailable', `${lang} aksanında ses bulunamadı. Cihazına bu dilde ses yükleyebilir veya metinle devam edebilirsin.`, lang);
    }
    request.voiceName = voice.name;
    return new Promise(resolve => {
      let utterance;
      let settled = false;
      request.finish = value => {
        if (settled) return;
        settled = true;
        if (utterance) utterance.onend = utterance.onerror = utterance.onstart = null;
        if (active === request) active = null;
        resolve(value);
      };
      const current = () => !settled && active === request && !request.cancelled;
      try {
        utterance = new Utterance(text);
        // Keep the utterance strongly referenced until completion/cancellation.
        request.utterance = utterance;
        utterance.voice = voice;
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.onend = () => {
          if (!current()) return;
          request.finish(result(true, 'completed', lang, voice.name));
          status('completed', 'Ses tamamlandı.', lang, voice.name);
        };
        utterance.onerror = event => {
          if (!current()) return;
          const reason = event.error || 'speech-error';
          request.finish(result(false, reason, lang, voice.name));
          failure(reason, `Ses oynatılamadı (${reason}). Metinle devam edebilirsin.`, lang, voice.name);
        };
        synth.speak(utterance);
      } catch {
        if (!current()) return;
        request.finish(result(false, 'speech-error', lang, voice.name));
        failure('speech-error', 'Ses oynatılamadı. Metinle devam edebilirsin.', lang, voice.name);
      }
    });
  }
  function dispose() { disposed = true; cancel(); }
  return { speak, cancel, getVoices, dispose };
}

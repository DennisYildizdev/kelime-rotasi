export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = 'kr-state-v2';
export const DEFAULT_PREFERENCES = Object.freeze({ mode: 'focus', level: 'A1', sound: true, calm: false, showIpa: true, showApprox: true, accent: 'en-US', introductions: false, exercise: 'mixed' });
export function emptyState(contentVersion = '2') {
  return { schemaVersion: SCHEMA_VERSION, contentVersion, progress: {}, session: null, preferences: { ...DEFAULT_PREFERENCES } };
}
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const safeKey = k => !['__proto__', 'constructor', 'prototype'].includes(k);
function validProgress(progress) {
  return object(progress) && Object.entries(progress).every(([id, p]) => safeKey(id) && object(p)
    && ['streak', 'attempts', 'correctCount', 'consecutiveCorrect', 'dueAt', 'lastSeenAt'].every(k => p[k] === undefined || (Number.isFinite(p[k]) && p[k] >= 0))
    && ['lastResult', 'hintUsed', 'markedDifficult'].every(k => p[k] === undefined || typeof p[k] === 'boolean')
    && (p.mark === undefined || ['known', 'learning', 'difficult', ''].includes(p.mark)));
}
export function validateState(value, contentVersion = '2') {
  const errors = [];
  if (!object(value) || value.schemaVersion !== SCHEMA_VERSION) return ['Desteklenmeyen kayıt şeması.'];
  if (value.contentVersion !== contentVersion) errors.push('İçerik sürümü uyumsuz.');
  if (!validProgress(value.progress)) errors.push('İlerleme verisi geçersiz.');
  const p = value.preferences;
  if (!object(p) || !['tiny', 'focus', 'challenge'].includes(p.mode) || !['A1', 'A2', 'B1', 'B2'].includes(p.level)
    || !['en-US', 'en-GB'].includes(p.accent) || !['mixed', 'meaning', 'reverse', 'spelling', 'listening', 'context'].includes(p.exercise)
    || !['sound', 'calm', 'showIpa', 'showApprox', 'introductions'].every(k => typeof p[k] === 'boolean')) errors.push('Tercihler geçersiz.');
  const s = value.session;
  if (s !== null) {
    const valid = object(s) && s.schemaVersion === SCHEMA_VERSION && s.contentVersion === contentVersion
      && typeof s.sessionId === 'string' && ['tiny', 'focus', 'challenge'].includes(s.mode) && ['A1', 'A2', 'B1', 'B2'].includes(s.level)
      && Array.isArray(s.questions) && s.questions.length > 0 && s.questions.length <= 10
      && s.questions.every(q => object(q) && typeof q.id === 'string' && typeof q.wordId === 'string' && safeKey(q.wordId)
        && ['meaning', 'reverse', 'spelling', 'listening', 'context'].includes(q.type) && Number.isFinite(q.seed) && typeof q.intro === 'boolean')
      && new Set(s.questions.map(q => q.id)).size === s.questions.length
      && Number.isInteger(s.currentIndex) && s.currentIndex >= 0 && s.currentIndex <= s.questions.length
      && Number.isInteger(s.score) && s.score >= 0 && s.score <= s.currentIndex + Number(s.answered)
      && ['answered', 'correct', 'hintUsed', 'listeningFallback', 'introDismissed', 'completed'].every(k => typeof s[k] === 'boolean')
      && s.completed === (s.currentIndex === s.questions.length) && (!s.completed || !s.answered)
      && typeof s.selectedAnswer === 'string' && s.selectedAnswer.length <= 1000 && Number.isFinite(s.updatedAt);
    if (!valid) errors.push('Seans verisi geçersiz.');
  }
  return errors;
}
export function exportState(value) {
  const errors = validateState(value, value.contentVersion);
  if (errors.length) throw Error(errors.join(' '));
  return JSON.stringify(value, null, 2);
}
export function importState(text, contentVersion = '2') {
  if (typeof text !== 'string' || text.length > 5000000) throw Error('Yedek dosyası çok büyük veya geçersiz.');
  let value;
  try { value = JSON.parse(text); } catch { throw Error('Geçerli bir JSON yedeği seç.'); }
  const errors = validateState(value, contentVersion);
  if (errors.length) throw Error(errors.join(' '));
  return value;
}
export function createStorage({ storage, contentVersion = '2', onWarning = () => {} } = {}) {
  const warn = detail => onWarning(`Kayıt uyarısı: ${detail} İlerlemeyi dışa aktararak yedekleyebilirsin.`);
  let driver = storage;
  let blocked = false;
  if (!driver) { try { driver = globalThis.localStorage; } catch { blocked = true; } }
  const get = key => { if (!driver || blocked) throw Error('erişim yok'); return driver.getItem(key); };
  function load() {
    const result = emptyState(contentVersion);
    try {
      const raw = get(STORAGE_KEY);
      if (raw) {
        let parsed;
        try { parsed = JSON.parse(raw); } catch { /* Preserve the unreadable original below. */ }
        const errors = validateState(parsed, contentVersion);
        if (!errors.length) return parsed;
        // Keep the exact original before allowing any writes to the active key.
        try {
          driver.setItem(`${STORAGE_KEY}-recovery-${Date.now()}`, raw);
        } catch { blocked = true; }
        if (validProgress(parsed?.progress)) result.progress = parsed.progress;
        warn(errors.join(' ') + (blocked ? ' Eski kayıt korunuyor; yeni kayıtlar yalnızca bellekte.' : ' Eski kayıt ayrı kurtarma yedeğinde korundu. Geçerli kelime ilerlemesi alındı; seans yeniden başlatılmalı.'));
        return result;
      }
      const old = get('kr-progress');
      if (old) {
        const progress = JSON.parse(old);
        if (validProgress(progress)) result.progress = progress;
        else warn('Eski ilerleme bozuk; silinmedi.');
      }
      const mode = get('kr-mode'), level = get('kr-level');
      if (['tiny', 'focus', 'challenge'].includes(mode)) result.preferences.mode = mode;
      if (['A1', 'A2', 'B1', 'B2'].includes(level)) result.preferences.level = level;
      result.preferences.sound = get('kr-sound') !== 'off';
      result.preferences.calm = get('kr-calm') === 'on';
    } catch { blocked = true; warn('Tarayıcı kaydı okunamadı; bu oturum geçici olabilir. Eski veri silinmedi.'); }
    return result;
  }
  function save(value) {
    try {
      const errors = validateState(value, contentVersion);
      if (errors.length) throw Error(errors.join(' '));
      if (!driver || blocked) throw Error('erişim yok');
      // One localStorage entry commits progress and session together.
      driver.setItem(STORAGE_KEY, JSON.stringify(value));
      return true;
    } catch { warn('Kaydedilemedi; bu oturum yalnızca bellekte tutuluyor.'); return false; }
  }
  return { load, save };
}

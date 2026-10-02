import { makeChoices, normalizeAnswer, gradeAnswer } from './learning-engine.js';
const meanings = word => String(word.translation || '').split(/[,;]/).map(s => s.trim().toLocaleLowerCase('tr')).filter(Boolean);
function unambiguousPool(word, pool) {
  const accepted = meanings(word);
  return pool.filter(w => w.id === word.id || (normalizeAnswer(w.word) !== normalizeAnswer(word.word) && !meanings(w).some(s => accepted.includes(s))));
}
export function contextGap(word) {
  if (!word.word || !word.example) return null;
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escaped})(?=$|[^\\p{L}\\p{N}_])`, 'giu');
  if (!pattern.test(word.example)) return null;
  pattern.lastIndex = 0;
  return word.example.replace(pattern, '$1____');
}
export function createExercise(word, pool, { type = 'meaning', seed = 1, listeningFallback = false } = {}) {
  word = { ...word, word: word.displayWord || word.word };
  pool = pool.map(w => ({ ...w, word: w.displayWord || w.word }));
  let note = '';
  if (type === 'listening' && listeningFallback) { type = 'reverse'; note = 'Ses yerine görsel alternatif: Türkçe anlamdan kelimeyi seç.'; }
  const gap = type === 'context' ? contextGap(word) : null;
  if (type === 'context' && !gap) { type = 'spelling'; note = 'Örnek cümlede hedef kelime aynen bulunmadığı için yazma sorusuna geçildi.'; }
  const labels = { meaning: 'Doğru Türkçe anlamı seç', reverse: 'İngilizce kelimeyi seç', spelling: 'İngilizce kelimeyi yaz', listening: 'Dinle ve duyduğun kelimeyi seç', context: 'Boşluğa gelen kelimeyi seç' };
  const expected = type === 'meaning' ? word.translation : word.word;
  const typed = type === 'spelling';
  const choices = typed ? [] : makeChoices(word, unambiguousPool(word, pool), { field: type === 'meaning' ? 'translation' : 'word', seed });
  if (!typed && choices.length < 2) return { type: 'spelling', label: labels.spelling, prompt: word.translation, expected: word.word, acceptedAnswers: [word.word, ...(word.acceptedAnswers || [])], typed: true, choices: [], note: 'Yeterli farklı seçenek olmadığı için kelimeyi yazarak devam et.' };
  return { type, label: labels[type], prompt: type === 'meaning' ? word.word : type === 'listening' ? 'Sesi dinle' : type === 'context' ? gap : word.translation,
    expected, acceptedAnswers: type === 'meaning' ? [expected] : [word.word, ...(word.acceptedAnswers || [])], typed, choices, note };
}
export function searchWords(words, { query = '', level = '', topic = '', mark = '', progress = {}, page = 1, pageSize = 40 } = {}) {
  const en = query.trim().toLocaleLowerCase('en');
  const tr = query.trim().toLocaleLowerCase('tr');
  const filtered = words.filter(w => (!en || w.word.toLocaleLowerCase('en').includes(en) || String(w.translation || '').toLocaleLowerCase('tr').includes(tr))
    && (!level || w.level === level) && (!topic || w.topicTags?.includes(topic)) && (!mark || progress[w.id]?.mark === mark));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.max(1, Math.min(pages, page));
  return { items: filtered.slice((current - 1) * pageSize, current * pageSize), total: filtered.length, pages, page: current };
}

export function checkExerciseAnswer(exercise, answer) {
  return exercise.acceptedAnswers.some(expected => gradeAnswer(answer, expected));
}

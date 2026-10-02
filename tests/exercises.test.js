import test from 'node:test';
import assert from 'node:assert/strict';
const exercises = await import('../src/exercises.js').catch(() => ({}));
const pool = [
  { id: 'apple', word: 'apple', translation: 'elma', level: 'A1', example: 'This apple is red.', topicTags: ['food'] },
  { id: 'book', word: 'book', translation: 'kitap', level: 'A1', example: 'A book is here.' },
  { id: 'fruit', word: 'fruit', translation: 'elma, meyve', level: 'A1' },
  { id: 'add', word: 'add', translation: 'eklemek', level: 'A1', example: 'My address is here.' }
];
test('EN/TR search filters topic, level, personal marks with explicit pagination counts', () => {
  assert.equal(typeof exercises.searchWords, 'function');
  const progress = { apple: { mark: 'difficult' }, book: { mark: 'known' } };
  assert.deepEqual(exercises.searchWords(pool, { query: 'ELMA' }).items.map(w => w.id), ['apple', 'fruit']);
  assert.equal(exercises.searchWords(pool, { query: 'apple', mark: 'difficult', progress }).total, 1);
  assert.equal(exercises.searchWords(pool, { topic: 'food' }).total, 1);
  assert.equal(exercises.searchWords(pool, { level: 'B2' }).total, 0);
  const result = exercises.searchWords(pool, { pageSize: 2, page: 2 });
  assert.equal(result.total, 4); assert.equal(result.pages, 2); assert.equal(result.items.length, 2);
  assert.equal(exercises.searchWords(pool, { page: 99, pageSize: 2 }).page, 2);
});

test('all exercise directions grade real answers and context never removes substrings', () => {
  assert.equal(typeof exercises.createExercise, 'function');
  for (const type of ['meaning', 'reverse', 'spelling', 'listening', 'context']) {
    const ex = exercises.createExercise(pool[0], pool, { type, seed: 3 });
    assert.equal(ex.type, type);
    assert.equal(exercises.checkExerciseAnswer(ex, type === 'meaning' ? 'elma' : 'APPLE'), true);
    assert.equal(exercises.checkExerciseAnswer(ex, 'wrong'), false);
    if (type === 'context') assert.equal(ex.prompt, 'This ____ is red.');
    if (type !== 'meaning') assert.equal(ex.prompt.includes('apple'), false);
    assert.equal(ex.choices?.includes('fruit') ?? false, false);
  }
  const fallback = exercises.createExercise(pool[3], pool, { type: 'context' });
  assert.equal(fallback.type, 'spelling');
  assert.ok(fallback.note);
  const listening = exercises.createExercise(pool[0], pool, { type: 'listening', listeningFallback: true });
  assert.equal(listening.type, 'reverse');
  assert.ok(listening.note);
  assert.equal(exercises.createExercise(pool[0], pool, { type: 'meaning' }).choices.includes('elma, meyve'), false);
});

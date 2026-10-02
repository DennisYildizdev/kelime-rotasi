import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSession,
  gradeAnswer,
  nextReview,
  normalizeAnswer,
  sessionSizeForMode,
  makeChoices
} from '../src/learning-engine.js';

test('queue puts due reviews first, excludes future reviews, caps challenge new words', () => {
  const pool = Array.from({ length: 12 }, (_, i) => ({ id: `w${i}`, word: `w${i}`, level: 'A1' }));
  const progress = { w0: { dueAt: 50 }, w1: { dueAt: 200 } };
  const session = buildSession(pool, { size: 10, now: 100, progress, seed: 2 });
  assert.equal(session[0].id, 'w0');
  assert.equal(session.length, 10);
  assert.equal(session.some(w => w.id === 'w1'), false);
  assert.ok(new Set(session.filter(w => !progress[w.id]).map(w => w.id)).size <= 5);
  assert.deepEqual(buildSession(pool.slice(1, 2), { now: 100, progress }), []);
});

test('durable sessions award once, finish 1/5/10, preserve hints and resume feedback', async () => {
  const engine = await import('../src/learning-engine.js');
  assert.equal(typeof engine.createSession, 'function');
  for (const mode of ['tiny', 'focus', 'challenge']) {
    const pool = Array.from({ length: 8 }, (_, i) => ({ id: `w${i}`, word: `w${i}`, translation: `anlam${i}`, level: 'A1' }));
    let state = { contentVersion: '2', progress: {}, session: engine.createSession(pool, { mode, now: 100, seed: 2 }) };
    assert.equal(state.session.questions.length, sessionSizeForMode(mode));
    while (!state.session.completed) {
      const before = state;
      state = engine.recordAnswer(state, { answer: 'yes', correct: true, now: 200 });
      assert.notDeepEqual(state, before);
      assert.deepEqual(engine.recordAnswer(state, { answer: 'yes', correct: true, now: 200 }), state);
      state = engine.advanceSession(JSON.parse(JSON.stringify(state)), 201);
    }
    assert.equal(state.session.score, sessionSizeForMode(mode));
    assert.equal(Object.values(state.progress).reduce((n, p) => n + p.attempts, 0), sessionSizeForMode(mode));
  }
  const plain = nextReview({}, true, 100);
  const hinted = nextReview({}, true, 100, { hintUsed: true });
  assert.ok(hinted.dueAt < plain.dueAt);
  assert.equal(hinted.streak, 0);
  assert.equal(hinted.hintUsed, true);
});

test('mixed challenge revisits each new word with a different exercise type', async () => {
  const { createSession } = await import('../src/learning-engine.js');
  const pool = Array.from({ length: 8 }, (_, i) => ({ id: `m${i}`, word: `m${i}`, level: 'A1' }));
  const session = createSession(pool, { mode: 'challenge', seed: 2 });
  for (const id of new Set(session.questions.map(q => q.wordId))) {
    assert.ok(new Set(session.questions.filter(q => q.wordId === id).map(q => q.type)).size >= 2);
  }
});

test('epoch-zero due date is a review, not a duplicate new item', () => {
  const pool = [{ id: 'old', word: 'old', level: 'A1' }, { id: 'new', word: 'new', level: 'A1' }];
  const queue = buildSession(pool, { progress: { old: { dueAt: 0 } }, now: 100, size: 5 });
  assert.deepEqual(queue.map(w => w.id), ['old', 'new']);
});

const words = [
  { id: 'apple', word: 'apple', level: 'A1' },
  { id: 'book', word: 'book', level: 'A1' },
  { id: 'abandon', word: 'abandon', level: 'B2' }
];

test('normalizeAnswer ignores case and surrounding whitespace', () => {
  assert.equal(normalizeAnswer('  APPLE '), 'apple');
});

test('gradeAnswer accepts an exact normalized answer', () => {
  assert.equal(gradeAnswer(' Apple ', 'apple'), true);
  assert.equal(gradeAnswer('pear', 'apple'), false);
});

test('buildSession respects level and micro-session size', () => {
  const session = buildSession(words, { level: 'A1', size: 1, seed: 3 });
  assert.equal(session.length, 1);
  assert.equal(session[0].level, 'A1');
});

test('nextReview schedules incorrect answers sooner than correct answers', () => {
  const now = Date.UTC(2026, 8, 29);
  const incorrect = nextReview({ streak: 3 }, false, now);
  const correct = nextReview({ streak: 3 }, true, now);
  assert.ok(incorrect.dueAt < correct.dueAt);
  assert.equal(incorrect.streak, 0);
  assert.equal(correct.streak, 4);
});

test('sessionSizeForMode keeps low-energy sessions tiny', () => {
  assert.equal(sessionSizeForMode('tiny'), 1);
  assert.equal(sessionSizeForMode('focus'), 5);
  assert.equal(sessionSizeForMode('challenge'), 10);
});

test('makeChoices includes the answer without duplicates', () => {
  const pool = [
    { word: 'apple', translation: 'elma' },
    { word: 'book', translation: 'kitap' },
    { word: 'cat', translation: 'kedi' },
    { word: 'dog', translation: 'köpek' }
  ];
  const choices = makeChoices(pool[0], pool, { field: 'translation', count: 4, seed: 2 });
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices).size, 4);
  assert.ok(choices.includes('elma'));
});

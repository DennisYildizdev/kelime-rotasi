import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { joinContent, isEligible, validateContent, getPronunciation } from '../src/content.js';
import { createExercise, checkExerciseAnswer, contextGap } from '../src/exercises.js';
const source = JSON.parse(readFileSync(new URL('../data/words.json', import.meta.url), 'utf8'));
const data = JSON.parse(readFileSync(process.env.A1_ENRICHMENT || new URL('../data/enrichment.json', import.meta.url), 'utf8'));
// Levels come from a CLI argument or the environment: `VAR=value` prefixes are
// not portable across the shells npm runs on Windows.
const argLevels = process.argv.slice(2).find(value => value.includes(',')) || process.argv[2];
const LEVELS = (argLevels || process.env.COVERAGE_LEVELS || 'A1').split(',').map(level => level.trim()).filter(Boolean);
const TYPES = ['meaning', 'reverse', 'spelling', 'listening', 'context'];

assert.deepEqual(validateContent(data), []);

const joined = joinContent(source, data);
const cards = joined.filter(isEligible);
const byLevel = new Map();
for (const level of LEVELS) {
  const expected = source.filter(w => w.level === level);
  const pool = cards.filter(card => card.level === level);
  // Every source ID at this level must have a complete usable card.
  assert.equal(pool.length, expected.length, `every ${level} source ID needs a complete usable card`);
  assert.deepEqual(new Set(pool.map(w => w.id)), new Set(expected.map(w => w.id)), `${level} ID set mismatch`);
  assert.ok(pool.every(w => w.level === level && w.reviewStatus === 'draft' && w.sourceId === w.id), `${level} status/sourceId`);
  let checks = 0;
  for (const card of pool) {
    // Exercise construction is scoped to the card's own level, as the app does.
    const word = { ...card, word: card.displayWord || card.word };
    assert.ok(getPronunciation(word, 'en-US').ipa && getPronunciation(word, 'en-US').approxTr, card.id);
    assert.ok(contextGap(word), `literal target absent: ${card.id}`);
    for (const type of TYPES) {
      const exercise = createExercise(word, pool, { type, seed: 7 });
      assert.equal(exercise.type, type, `${card.id}: ${type} should not fall back`);
      assert.ok(checkExerciseAnswer(exercise, exercise.expected), `${card.id}: correct answer rejected`);
      if (!exercise.typed) {
        assert.ok(exercise.choices.includes(exercise.expected), card.id);
        assert.equal(new Set(exercise.choices).size, exercise.choices.length, card.id);
      }
      checks++;
    }
  }
  byLevel.set(level, {
    sourceRecords: expected.length,
    eligibleCards: pool.length,
    reviewedCards: pool.filter(c => c.reviewStatus === 'reviewed').length,
    ukAvailable: pool.filter(c => getPronunciation(c, 'en-GB').ipa).length,
    exerciseChecks: checks,
  });
}

// Source identity and progress IDs must survive every level's enrichment.
for (const card of cards) {
  const origin = source.find(w => w.id === card.sourceId);
  assert.ok(origin, `${card.id}: no source record`);
  assert.equal(card.word, origin.word, `${card.id}: headword changed`);
  assert.equal(card.level, origin.level, `${card.id}: level changed`);
}

console.log(JSON.stringify({
  ok: true,
  levels: Object.fromEntries(byLevel),
  eligibleTotal: cards.length,
  exerciseChecks: [...byLevel.values()].reduce((sum, v) => sum + v.exerciseChecks, 0),
  reviewed: [...byLevel.values()].reduce((sum, v) => sum + v.reviewedCards, 0),
}));
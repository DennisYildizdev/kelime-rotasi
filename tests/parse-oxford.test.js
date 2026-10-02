import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEntry, parseLayoutText } from '../scripts/parse-oxford-lib.js';

test('parseEntry extracts word, part of speech and CEFR level', () => {
  assert.deepEqual(parseEntry('apple n. A1'), {
    word: 'apple',
    partOfSpeech: 'n.',
    level: 'A1',
    raw: 'apple n. A1'
  });
});

test('parseEntry keeps multi-word headwords', () => {
  assert.equal(parseEntry('according to prep. A2').word, 'according to');
});

test('parseLayoutText extracts entries from spaced PDF columns', () => {
  const text = 'apple n. A1                  abandon v. B2\nbook n. A1                   calm adj., v., n. B1';
  const rows = parseLayoutText(text);
  assert.deepEqual(rows.map(row => row.word), ['apple', 'abandon', 'book', 'calm']);
});

test('parseLayoutText skips headings, copyright and page counters', () => {
  const text = 'The Oxford 3000TM\n© Oxford University Press 1 / 11\nword n. A1';
  assert.deepEqual(parseLayoutText(text).map(row => row.word), ['word']);
});

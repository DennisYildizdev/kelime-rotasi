import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { joinContent, validateContent, getPronunciation } from '../src/content.js';
const pilot = () => structuredClone(JSON.parse(readFileSync(new URL('../data/enrichment.json', import.meta.url), 'utf8')).always);

test('a complete US card remains teachable without an unverified UK pronunciation', () => {
  const entry = pilot();
  delete entry.pronunciations['en-GB'];
  assert.deepEqual(validateContent({ always: entry }), []);
  const [word] = joinContent([{ id: entry.sourceId, word: 'always', level: 'A1' }], { always: entry });
  assert.equal(word.eligible, true);
  assert.deepEqual(getPronunciation(word, 'en-GB'), { ipa: '', approxTr: '' });
  assert.equal(getPronunciation(word, 'en-US').approxTr, 'ool-veyz');
  entry.pronunciations['en-GB'] = { ipa: '/x/', approxTr: '' };
  assert.ok(validateContent({ always: entry }).some(e => e.includes('en-GB')));
  delete entry.pronunciations['en-US'];
  assert.ok(validateContent({ always: entry }).some(e => e.includes('en-US')));
});

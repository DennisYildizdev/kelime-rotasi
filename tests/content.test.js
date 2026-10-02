import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('validation CLI reports measured coverage without labelling drafts as reviewed', () => {
  const output = execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/validate-content.js', import.meta.url))], { encoding: 'utf8' });
  const report = JSON.parse(output);
  assert.equal(report.errors.length, 0);
  assert.equal(report.sourceRecords, load('words').length);
  assert.equal(report.enrichedEntries, 3000);
  assert.equal(report.eligibleCards, 3000);
  assert.equal(report.reviewedCards, 0);
  assert.equal(report.levels.A1.eligibleCards, 900);
  assert.equal(report.levels.A2.eligibleCards, 800);
  assert.equal(report.levels.B1.eligibleCards, 700);
  assert.equal(report.levels.B2.eligibleCards, 600);
});

const load = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));

test('content migration preserves the pilot and explicitly maps the combined article', async () => {
  const { CONTENT_VERSION, joinContent, getPronunciation, validateContent, isEligible } = await import('../src/content.js');
  const source = load('words');
  const enrichment = load('enrichment');
  const snapshot = structuredClone(source);
  const joined = joinContent(source, enrichment);
  assert.equal(CONTENT_VERSION, '2');
  assert.equal(joined.length, source.length);
  assert.deepEqual(source, snapshot);
  for (const [i, word] of joined.entries()) {
    for (const [key, value] of Object.entries(source[i])) assert.deepEqual(word[key], value);
  }
  assert.equal(Object.keys(enrichment).length, 3000);
  assert.equal(joined.filter(isEligible).length, 3000);
  assert.deepEqual(validateContent(enrichment), []);
  const always = joined.find(w => w.word === 'always');
  assert.equal(getPronunciation(always).approxTr, 'ool-veyz');
  assert.equal(getPronunciation(always, 'en-GB').approxTr, 'ool-veyz');
  const article = joined.find(w => w.word === 'a, an');
  assert.equal(article.eligible, true);
  assert.equal(article.displayWord, 'a');
  assert.equal(article.speechText, 'a');
  assert.equal(article.translation, 'bir');
  assert.equal(article.reviewStatus, 'draft');
  // Every source record now has a card; the pilot guarantees stay pinned.
  assert.equal(joined.find(w => w.word === 'aged').eligible, true);
  assert.equal(joined.find(w => w.word === 'abandon').eligible, true);
  assert.equal(load('ipa').length, 19);
});

test('malformed, rejected and unscoped duplicate records cannot enter lessons', async () => {
  const { joinContent, validateContent, isEligible, getPronunciation } = await import('../src/content.js');
  const valid = load('enrichment').always;
  for (const field of ['translation', 'ipa', 'approxTr', 'example', 'exampleTr']) {
    const entry = { ...valid, [field]: '  ' };
    assert.ok(validateContent({ always: entry }).some(error => error.includes(field)));
    assert.equal(joinContent([{ word: 'always', level: 'A1' }], { always: entry })[0].eligible, false);
  }
  const broken = structuredClone(valid);
  broken.pronunciations['en-US'].approxTr = ' ';
  broken.provenance[0].note = '';
  assert.ok(validateContent({ always: broken }).length >= 2);
  assert.ok(validateContent(null).length);
  assert.equal(joinContent([{ word: 'always', level: 'A1' }], { always: { ...valid, reviewStatus: 'rejected' } })[0].eligible, false);
  assert.equal(isEligible({ ...valid, eligible: false }), false);
  assert.deepEqual(getPronunciation({}, 'en-US'), { ipa: '', approxTr: '' });
  assert.deepEqual(getPronunciation(valid, 'en-AU'), { ipa: '', approxTr: '' });
  // Matching a headword alone is unsafe when more than one source sense exists.
  const duplicates = [{ id: 'one', word: 'always', level: 'A1' }, { id: 'two', word: 'always', level: 'A1' }];
  assert.ok(joinContent(duplicates, { always: valid }).every(word => !word.eligible));
  assert.equal(joinContent([{ word: 'Always', level: 'A1' }], { always: valid })[0].eligible, false);
  assert.equal(joinContent([{ word: 'always', level: 'B2' }], { always: valid })[0].eligible, false);
  assert.equal(joinContent([{ id: 'a-an-1', word: 'a,an', level: 'A1' }], load('enrichment'))[0].eligible, true);
  assert.deepEqual(joinContent([{ word: 'unknown' }], null), [{ word: 'unknown', eligible: false }]);
});

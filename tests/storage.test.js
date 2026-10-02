import test from 'node:test';
import assert from 'node:assert/strict';
import * as storage from '../src/storage.js';
test('session schema validates atomic resume and versioned import/export without data loss', async () => {
  const { createSession, recordAnswer } = await import('../src/learning-engine.js');
  const driver = memory();
  const store = storage.createStorage({ storage: driver, contentVersion: '2' });
  let state = store.load();
  state.session = createSession([{ id: 'apple', word: 'apple', level: 'A1' }], { mode: 'tiny' });
  state = recordAnswer(state, { answer: 'elma', correct: true });
  assert.equal(store.save(state), true);
  assert.deepEqual(store.load(), state);
  assert.equal(typeof storage.exportState, 'function');
  assert.deepEqual(storage.importState(storage.exportState(state), '2'), state);
  assert.throws(() => storage.importState(storage.exportState(state), '3'), /sürümü/);
  for (const mutate of [s => { s.session.currentIndex = 99; }, s => { s.session.score = -1; }, s => { s.session.questions[0].type = 'evil'; }, s => { s.preferences.accent = 'tr-TR'; }, s => { s.progress.apple.attempts = 'x'; }]) {
    const bad = structuredClone(state); mutate(bad);
    assert.ok(storage.validateState(bad, '2').length);
    assert.throws(() => storage.importState(JSON.stringify(bad), '2'));
  }
  assert.equal(driver.data['kr-state-v2'], JSON.stringify(state));
});

test('invalid or old-version state is preserved before new writes; valid progress survives version changes', () => {
  for (const raw of ['{oops', JSON.stringify({ ...storage.emptyState('1'), progress: { apple: { streak: 2, dueAt: 400 } } })]) {
    const driver = memory({ 'kr-state-v2': raw });
    const store = storage.createStorage({ storage: driver });
    const state = store.load();
    if (raw.startsWith('{"')) assert.equal(state.progress.apple.streak, 2);
    assert.equal(store.save(state), true);
    assert.ok(Object.entries(driver.data).some(([key, value]) => key !== 'kr-state-v2' && value === raw));
  }
  const driver = memory({ 'kr-state-v2': '{bad' });
  driver.setItem = () => { throw Error('quota'); };
  const store = storage.createStorage({ storage: driver });
  assert.equal(store.save(store.load()), false);
  assert.equal(driver.data['kr-state-v2'], '{bad');
});

test('unreadable storage never overwrites unseen data even if writes are permitted', () => {
  let writes = 0;
  const store = storage.createStorage({ storage: { getItem() { throw Error('read blocked'); }, setItem() { writes++; } } });
  const state = store.load();
  assert.equal(store.save(state), false);
  assert.equal(writes, 0);
});

const memory = (initial = {}) => { const data = { ...initial }; return { data, getItem: k => data[k] ?? null, setItem: (k, v) => { data[k] = v; } }; };
test('safe storage migrates legacy progress without deleting it and reports failures', () => {
  assert.equal(typeof storage.createStorage, 'function');
  const old = JSON.stringify({ apple: { streak: 2, dueAt: 400, lastResult: true } });
  const driver = memory({ 'kr-progress': old });
  const store = storage.createStorage({ storage: driver, contentVersion: '2' });
  const state = store.load();
  assert.equal(state.progress.apple.streak, 2);
  assert.equal(state.preferences.accent, 'en-US');
  assert.equal(store.save(state), true);
  assert.equal(driver.data['kr-progress'], old);
  assert.deepEqual(store.load(), state);
  const warnings = [];
  const bad = storage.createStorage({ storage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } }, onWarning: m => warnings.push(m) });
  const fallback = bad.load();
  assert.equal(bad.save(fallback), false);
  assert.ok(warnings.length >= 2);
  const corrupt = storage.createStorage({ storage: memory({ 'kr-state-v2': '{oops' }), onWarning: m => warnings.push(m) });
  assert.deepEqual(corrupt.load().progress, {});
});

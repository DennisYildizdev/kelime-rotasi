import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const page = await context.newPage();
page.setDefaultTimeout(6000);
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));
const url = process.env.TEST_URL || 'http://127.0.0.1:4173';
const snapshot = () => page.evaluate(() => JSON.parse(localStorage.getItem('kr-state-v2')));
async function answerCurrent({ wrong = false, hint = false } = {}) {
  if (await page.locator('#introContinue').count()) await page.locator('#introContinue').click();
  const saved = await snapshot();
  const q = saved.session.questions[saved.session.currentIndex];
  const answer = await page.evaluate(async ({ q }) => {
    const { joinContent } = await import('/src/content.js');
    const { createExercise } = await import('/src/exercises.js');
    const words = joinContent(await (await fetch('/data/words.json')).json(), await (await fetch('/data/enrichment.json')).json()).filter(w => w.eligible);
    const word = words.find(w => w.id === q.wordId);
    return createExercise(word, words, q).expected;
  }, { q });
  if (await page.locator('#listeningFallback').count()) await page.locator('#listeningFallback').click();
  if (await page.locator('#typedAnswer').count()) {
    if (hint) await page.locator('#showHint').click();
    await page.locator('#typedAnswer').fill(wrong ? 'incorrect' : answer);
    await page.locator('#submitAnswer').click();
  } else {
    const choices = page.locator('[data-answer]');
    const values = await choices.evaluateAll(nodes => nodes.map(n => n.dataset.answer));
    const choice = wrong ? values.find(v => v !== answer) : answer;
    await page.locator('[data-answer]').filter({ hasText: new RegExp('^' + choice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).click();
  }
  await page.locator('.feedback').waitFor();
}
try {
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await page.title(), 'Kelime Rotası');
  assert.equal(await page.locator('.mode-card').count(), 3);
  assert.equal(await page.locator('#preferences').count(), 1, 'advanced preferences must be present');
  for (const [mode, count] of [['tiny', 1], ['focus', 5], ['challenge', 10]]) {
    await page.locator(`[data-mode="${mode}"]`).click();
    await page.locator('#startLesson').click();
    assert.equal(await page.locator('.bottom-nav').isHidden(), true);
    for (let i = 0; i < count; i++) {
      assert.equal(await page.locator('.counter').innerText(), `${i + 1}/${count}`);
      await answerCurrent({ wrong: mode === 'focus' && i === 0, hint: mode === 'focus' && i === 2 });
      assert.equal(await page.locator('.lesson-card .approx').count(), 1, 'feedback should not duplicate pronunciation');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (mode === 'focus' && i === 0) await page.screenshot({ path: 'after-mobile-lesson.png', fullPage: true });
      if (mode === 'focus' && i === 1) {
        const before = await snapshot();
        await page.locator('#pauseLesson').click();
        await page.reload({ waitUntil: 'networkidle' });
        await page.locator('#resumeLesson').click();
        assert.deepEqual(await snapshot(), before);
        assert.equal(await page.locator('[data-answer]:not(:disabled)').count(), 0);
        assert.equal(await page.locator('.feedback').count(), 1);
      }
      if (mode === 'focus' && i === 2) {
        const saved = await snapshot();
        assert.equal(saved.progress[saved.session.questions[i].wordId].hintUsed, true);
      }
      await page.locator('#nextQuestion').click();
    }
    await page.locator('.complete').waitFor();
    const saved = await snapshot();
    assert.equal(saved.session.completed, true);
    assert.equal(saved.session.score, mode === 'focus' ? 4 : count);
    if (mode === 'challenge') assert.ok(new Set(saved.session.questions.map(q => q.wordId)).size <= 5);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#finishLesson').click();
  }
  // EN/TR library search, marks, filters and persisted pronunciation preferences.
  await page.locator('[data-route="words"]').last().click();
  await page.locator('#wordSearch').fill('her zaman');
  assert.match(await page.locator('#wordList').innerText(), /always/);
  assert.match(await page.locator('#wordList').innerText(), /ool-veyz/);
  assert.match(await page.locator('#searchCount').innerText(), /2 sonuç/);
  await page.locator('.word-details summary').first().click();
  await page.locator('[data-mark-id]').first().selectOption('difficult');
  await page.locator('.library-filters summary').click();
  await page.locator('#filterMark').selectOption('difficult');
  assert.match(await page.locator('#searchCount').innerText(), /1 sonuç/);
  await page.locator('#filterMark').selectOption('known');
  assert.match(await page.locator('#searchCount').innerText(), /0 sonuç/);
  await page.locator('#filterMark').selectOption('');
  await page.locator('#wordSearch').fill('');
  assert.equal(await page.locator('.word-row').count(), 40);
  await page.locator('#nextPage').click();
  assert.match(await page.locator('#searchCount').innerText(), /Sayfa 2\//);
  await page.locator('[data-route="home"]').first().click();
  await page.locator('#preferences summary').click();
  await page.locator('#showIpa').uncheck();
  await page.locator('#showApprox').uncheck();
  await page.locator('#accentSelect').selectOption('en-GB');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal((await snapshot()).preferences.accent, 'en-GB');
  await page.locator('[data-route="words"]').last().click();
  await page.locator('#wordSearch').fill('always');
  assert.equal(await page.locator('#wordList .ipa').count(), 0);
  assert.equal(await page.locator('#wordList .approx').count(), 0);
  await page.locator('[data-route="home"]').first().click();
  await page.locator('#preferences summary').click();
  await page.locator('#showIpa').check(); await page.locator('#showApprox').check();
  await page.locator('#accentSelect').selectOption('en-US');
  await page.locator('#introductions').check();
  await page.locator('#exerciseSelect').selectOption('spelling');
  await page.locator('[data-mode="tiny"]').click();
  await page.locator('#startLesson').click();
  await page.locator('#introContinue').click();
  await page.locator('#typedAnswer').fill('unfinished');
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#resumeLesson').click();
  assert.equal(await page.locator('#typedAnswer').inputValue(), 'unfinished');
  await answerCurrent({ hint: true });
  await page.locator('#nextQuestion').click(); await page.locator('#finishLesson').click();

  // Versioned JSON round trip rejects invalid data, merges progress, and feeds the due queue.
  await page.locator('[data-route="progress"]').last().click();
  await page.locator('summary').filter({ hasText: 'İlerleme yedeği' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportProgress').click();
  const download = await downloadPromise;
  const { readFile } = await import('node:fs/promises');
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
  const beforeImport = await snapshot();
  assert.deepEqual(exported, beforeImport);
  await page.locator('#importProgress').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...exported, contentVersion: 'old' })) });
  await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('sürümü'));
  assert.deepEqual(await snapshot(), beforeImport);
  const alwaysId = await page.evaluate(async () => (await (await fetch('/data/words.json')).json()).find(w => w.word === 'always').id);
  const imported = { ...exported, session: null, preferences: { ...exported.preferences, exercise: 'meaning', mode: 'tiny', level: 'A1' }, progress: { [alwaysId]: { dueAt: 100, streak: 1 }, 'preserved-legacy-id': { dueAt: 900, streak: 2 } } };
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#importProgress').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
  await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('içe aktarıldı'));
  const afterImport = await snapshot();
  assert.equal(afterImport.progress['preserved-legacy-id'].streak, 2);
  for (const id of Object.keys(beforeImport.progress)) assert.ok(afterImport.progress[id]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-route="progress"]').last().click();
  await page.locator('#reviewLesson').click();
  assert.equal((await snapshot()).session.questions[0].wordId, alwaysId);
  await answerCurrent(); await page.locator('#nextQuestion').click(); await page.locator('#finishLesson').click();

  // Exact accent and rate dispatch with a deterministic browser TTS boundary.
  const voiceContext = await browser.newContext({ serviceWorkers: 'block' });
  await voiceContext.addInitScript(() => {
    window.__spoken = [];
    const voices = [{ lang: 'en-US', name: 'Test US' }, { lang: 'en-GB', name: 'Test UK' }];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { constructor(text) { this.text = text; } } });
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => voices, cancel() {}, addEventListener() {}, removeEventListener() {}, speak(u) { window.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate, voice: u.voice.name }); if (!window.__holdSpeech) queueMicrotask(() => u.onend?.()); } } });
  });
  const vp = await voiceContext.newPage();
  vp.on('pageerror', e => errors.push(e.message));
  vp.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await vp.goto(url, { waitUntil: 'networkidle' });
  await vp.locator('[data-mode="tiny"]').click(); await vp.locator('#startLesson').click();
  await vp.locator('[data-speak]').first().click();
  await vp.locator('[data-rate="0.6"]').click();
  await vp.waitForFunction(() => window.__spoken.length === 2);
  assert.deepEqual(await vp.evaluate(() => window.__spoken.map(x => [x.lang, x.rate, x.voice])), [['en-US', 0.85, 'Test US'], ['en-US', 0.6, 'Test US']]);
  await vp.locator('#soundToggle').click(); await vp.locator('[data-speak]').first().click();
  await vp.waitForTimeout(100);
  assert.equal(await vp.evaluate(() => window.__spoken.length), 2, 'disabled sound must not synthesize');
  await vp.locator('#soundToggle').click(); await vp.locator('#exitLesson').click();
  await vp.locator('#preferences summary').click(); await vp.locator('#exerciseSelect').selectOption('listening');
  vp.once('dialog', dialog => dialog.accept()); await vp.locator('#startLesson').click();
  await vp.evaluate(() => { window.__holdSpeech = true; });
  await vp.locator('[data-listening]').first().click();
  await vp.locator('[data-rate="0.6"]').click();
  await vp.waitForTimeout(100);
  assert.equal(await vp.locator('.lesson-card').getAttribute('data-exercise'), 'listening', 'replaying slow speech must not trigger a text fallback');
  await vp.locator('#listeningFallback').click();
  assert.equal(await vp.locator('.lesson-card').getAttribute('data-exercise'), 'reverse');
  await vp.locator('#exitLesson').click();
  await vp.evaluate(() => { window.speechSynthesis.getVoices = () => []; window.__holdSpeech = false; });
  vp.once('dialog', dialog => dialog.accept()); await vp.locator('#startLesson').click();
  await vp.locator('[data-listening]').first().click();
  await vp.waitForFunction(() => document.querySelector('.lesson-card')?.dataset.exercise === 'reverse');
  assert.match(await vp.locator('#speechStatus').innerText(), /ses bulunamadı/);
  await voiceContext.close();

  // Storage exceptions remain visible while the local learning loop works.
  const blockedContext = await browser.newContext({ serviceWorkers: 'block' });
  await blockedContext.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
  const bp = await blockedContext.newPage(); bp.on('pageerror', e => errors.push(e.message));
  bp.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await bp.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await bp.locator('#storageWarning').isVisible(), true);
  await bp.locator('[data-mode="tiny"]').click(); await bp.locator('#startLesson').click();
  await bp.locator('[data-answer]').first().click(); await bp.locator('#nextQuestion').click();
  assert.equal(await bp.locator('.complete').count(), 1);
  await blockedContext.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, completedModes: [1, 5, 10], resume: true, searchAndMarks: true, preferences: true, speechDispatch: true, badStorage: true, consoleErrors: errors.length }));
} finally { await browser.close(); }

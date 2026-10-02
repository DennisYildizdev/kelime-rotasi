import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ serviceWorkers: 'block' });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
  await page.locator('#startLesson').waitFor();
  await page.evaluate(async () => {
    const { emptyState } = await import('/src/storage.js');
    const { createSession } = await import('/src/learning-engine.js');
    const { joinContent } = await import('/src/content.js');
    const words = joinContent(await (await fetch('/data/words.json')).json(), await (await fetch('/data/enrichment.json')).json());
    const article = words.find(w => w.displayWord === 'a');
    const state = emptyState('2');
    state.preferences = { ...state.preferences, mode: 'tiny', exercise: 'spelling', introductions: true };
    state.session = createSession([article], { ...state.preferences, contentVersion: '2' });
    localStorage.setItem('kr-state-v2', JSON.stringify(state));
  });
  await page.reload(); await page.locator('#resumeLesson').click();
  assert.equal(await page.locator('.word-display').innerText(), 'a', 'only the taught article is displayed');
  assert.equal(await page.locator('[data-speak]').first().getAttribute('data-speak'), 'a');
  const note = await page.evaluate(async () => (await (await fetch('/data/enrichment.json')).json())['a, an'].contentNote);
  assert.ok(note && (await page.locator('.feedback').innerText()).includes(note), 'word-specific scope note must be visible');
  await page.locator('#introContinue').click();
  await page.locator('#typedAnswer').fill('a'); await page.locator('#submitAnswer').click();
  assert.match(await page.locator('.feedback').innerText(), /Doğru — iyi yakaladın/);
  await page.locator('#nextQuestion').click();
  const completeText = await page.locator('.complete').innerText();
  assert.match(completeText, /1\/1 doğru/);
  assert.match(completeText, /Çalışılanlar: a\./);
  assert.doesNotMatch(completeText, /a, an/);
  console.log(JSON.stringify({ ok: true, articleDisplay: 'a', speechText: 'a', typedAnswerAccepted: true }));
} finally { await browser.close(); }

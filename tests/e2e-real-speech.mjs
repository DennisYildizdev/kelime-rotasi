import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  const page = await browser.newPage({ serviceWorkers: 'block' });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
  await page.locator('#startLesson').waitFor();
  await page.locator('[data-route="words"]').last().click();
  await page.locator('#wordSearch').fill('always');
  await page.locator('[data-speak="always"]').click();
  const result = await page.evaluate(async () => {
    const { createSpeechController } = await import('/src/speech.js');
    const statuses = [], notifications = [];
    const controller = createSpeechController({ notify: v => notifications.push(v), onStatus: v => statuses.push(v) });
    const withTimeout = promise => new Promise(resolve => {
      const timer = setTimeout(() => { controller.cancel(); resolve({ ok: false, reason: 'test-timeout' }); }, 20000);
      promise.then(value => { clearTimeout(timer); resolve(value); });
    });
    const normal = await withTimeout(controller.speak('always', { lang: 'en-US', rate: 0.85 }));
    const slow = await withTimeout(controller.speak('always', { lang: 'en-US', rate: 0.6 }));
    const voices = speechSynthesis.getVoices().map(v => ({ name: v.name, lang: v.lang, localService: v.localService }));
    controller.dispose(); return { normal, slow, voices, statuses, notifications };
  });
  console.log(JSON.stringify(result, null, 2));
  assert.equal(result.normal.ok, true);
  assert.equal(result.slow.ok, true);
  assert.equal(result.normal.lang, 'en-US');
  assert.ok(result.voices.some(v => v.name === result.normal.voiceName && v.lang === 'en-US'));
} finally { await browser.close(); }

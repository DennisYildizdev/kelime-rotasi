import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
const results = [], errors = [];
try {
  for (const width of [320, 390, 768, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173');
    await page.locator('#startLesson').waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `after-home-${width}.png`, fullPage: true });
    await page.locator('#preferences summary').focus(); await page.keyboard.press('Enter');
    await page.locator('#showIpa').focus(); await page.keyboard.press('Space');
    assert.equal(await page.locator('#showIpa').isChecked(), false);
    await page.keyboard.press('Space');
    await page.locator('#showApprox').focus(); await page.keyboard.press('Space');
    assert.equal(await page.locator('#showApprox').isChecked(), false);
    await page.keyboard.press('Space');
    await page.locator('#startLesson').click();
    await page.locator('[data-answer]').first().click();
    await page.locator('#nextQuestion').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.bottom-nav').isHidden(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const button = await page.locator('#nextQuestion').boundingBox();
    assert.ok(button.height >= 44 && button.width >= 44);
    await page.screenshot({ path: `after-lesson-${width}.png`, fullPage: true });
    results.push({ width, noOverflow: true, continuationTarget: button });
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, results, errors }));
} finally { await browser.close(); }

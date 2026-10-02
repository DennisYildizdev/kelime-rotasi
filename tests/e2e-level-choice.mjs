import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(resolve(root))) { res.writeHead(403); res.end(); return; }
  try { res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(await readFile(file)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
  await page.waitForSelector('[data-level="A1"]');

  const a2 = page.locator('[data-level="A2"]');
  assert.equal(await a2.isEnabled(), true, 'A2 must be selectable when its cards are published');
  await a2.click();
  assert.equal(await a2.getAttribute('aria-checked'), 'true');
  assert.match(await page.locator('#lessonContentCount').textContent(), /800 kelime/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kr-state-v2')).preferences.level), 'A2');

  await page.locator('[data-level="A1"]').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-level="A2"]').getAttribute('aria-checked'), 'true');

  const b1 = page.locator('[data-level="B1"]');
  assert.equal(await b1.isDisabled(), false, 'B1 must be selectable now that all 700 cards are published');
  await b1.click();
  assert.match(await page.locator('#lessonContentCount').textContent(), /700 kelime/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kr-state-v2')).preferences.level), 'B1');

  const b2 = page.locator('[data-level="B2"]');
  assert.equal(await b2.isDisabled(), false, 'B2 must be selectable now that all 600 cards are published');
  await b2.click();
  assert.match(await page.locator('#lessonContentCount').textContent(), /600 kelime/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kr-state-v2')).preferences.level), 'B2');
  assert.deepEqual(errors, []);
  console.log('level choices: pointer, keyboard, persistence and availability passed');
} finally {
  await browser.close();
  server.close();
}

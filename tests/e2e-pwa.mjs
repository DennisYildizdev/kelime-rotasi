import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

// Real Chromium lifecycle test with a loopback-only fixture server.
// Only the served SW cache version changes; application files are never edited.
const root=process.env.TEST_ROOT || fileURLToPath(new URL('../',import.meta.url));
const original=await readFile(resolve(root,'sw.js'),'utf8');
let release='e2e-old';
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/sw.js') {res.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'}); res.end(original.replace(/const CACHE = '[^']+';/,`const CACHE = 'kelime-rotasi-${release}';`));return;}
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(resolve(root))) {res.writeHead(403);res.end();return;}
  try{res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const errors=[];
context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
try{
  let page=await context.newPage();
  await page.goto(url);
  await page.locator('#startLesson').waitFor();
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await page.evaluate(async()=>{
    localStorage.setItem('pwa-test-sentinel','preserve-me');
    await caches.open('unrelated-app-cache');
  });
  await context.setOffline(true);
  await page.reload();
  await page.locator('#startLesson').waitFor();
  const offline=await page.evaluate(async()=>({
    words:(await (await fetch('./data/words.json')).json()).length,
    enrichment:Object.keys(await (await fetch('./data/enrichment.json')).json()).length,
    saved:localStorage.getItem('pwa-test-sentinel')
  }));
  assert.equal(offline.words,3000);
  assert.ok(offline.enrichment>0);
  assert.equal(offline.saved,'preserve-me');
  // Exercise and persist a real answer while offline, not only a sentinel.
  await page.locator('[data-mode="tiny"]').click();
  await page.locator('#startLesson').click();
  await page.locator('[data-answer]').first().click();
  await page.locator('#nextQuestion').waitFor();
  const savedLesson = await page.evaluate(() => localStorage.getItem('kr-state-v2'));
  assert.equal(JSON.parse(savedLesson).session.answered, true);
  await page.reload();
  await page.locator('#resumeLesson').click();
  assert.equal(await page.evaluate(() => localStorage.getItem('kr-state-v2')), savedLesson);
  await context.setOffline(false);
  release='e2e-new';
  await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});
  await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
  assert.equal(await page.evaluate(()=>localStorage.getItem('pwa-test-sentinel')),'preserve-me');
  assert.ok((await page.evaluate(()=>caches.keys())).includes('kelime-rotasi-e2e-old'));
  await page.close();
  page=await context.newPage();
  await page.goto(url);
  await page.waitForFunction(async()=>{
    const registration=await navigator.serviceWorker.getRegistration();
    const keys=await caches.keys();
    return registration?.active?.state==='activated' && !keys.includes('kelime-rotasi-e2e-old');
  });
  const after=await page.evaluate(async()=>({keys:await caches.keys(),saved:localStorage.getItem('pwa-test-sentinel')}));
  assert.ok(after.keys.includes('kelime-rotasi-e2e-new'));
  assert.ok(after.keys.includes('unrelated-app-cache'));
  assert.equal(after.saved,'preserve-me');
  assert.equal(await page.evaluate(() => localStorage.getItem('kr-state-v2')), savedLesson);
  await page.locator('#resumeLesson').click();
  await page.locator('#nextQuestion').click();
  await page.locator('.complete').waitFor();
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({ok:true,offline,update:'waiting -> close tabs -> activated',unrelatedCachePreserved:true,pageErrors:errors}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}

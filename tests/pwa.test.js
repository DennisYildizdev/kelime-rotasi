import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function worker(cacheKeys = []) {
  const events = {}; const removed = []; const precached = []; const claimed = [];
  const cache = { addAll: async assets => precached.push(...assets), match: async () => undefined };
  const context = {
    self: { location: { origin: 'https://example.test', href: 'https://example.test/sw.js' },
      registration: { scope: 'https://example.test/' },
      clients: { claim: async () => claimed.push(true) },
      addEventListener: (name, fn) => { events[name] = fn; } },
    caches: { keys: async () => cacheKeys, open: async () => cache,
      delete: async name => removed.push(name), match: async () => undefined },
    URL, Request, Response, fetch: async () => new Response('network'), console
  };
  vm.runInNewContext(await readFile(new URL('../sw.js', import.meta.url), 'utf8'), context);
  return { events, removed, precached, claimed };
}

test('activating a new version never deletes another app cache', async () => {
  const w = await worker(['other-app-cache', 'kelime-rotasi-v1']);
  let done; w.events.activate({ waitUntil: promise => { done = promise; } });
  await done;
  assert.ok(w.removed.includes('kelime-rotasi-v1'));
  assert.equal(w.removed.includes('other-app-cache'), false);
});

test('worker bypasses POST and cross-origin requests', async () => {
  const w = await worker();
  let calls = 0;
  for (const request of [new Request('https://example.test/api', {method: 'POST'}), new Request('https://elsewhere.test/audio')]) {
    w.events.fetch({request, respondWith: () => { calls += 1; }});
  }
  assert.equal(calls, 0);
});

test('offline install includes separated content and speech dependencies', async () => {
  const w = await worker();
  let done; w.events.install({waitUntil: promise => {done = promise;}});
  await done;
  for (const path of ['./src/exercises.js','./src/content.js','./src/storage.js','./src/speech.js','./src/pwa.js','./data/enrichment.json','./data/ipa.json']) {
    assert.ok(w.precached.includes(path), `${path} must be available offline`);
  }
});

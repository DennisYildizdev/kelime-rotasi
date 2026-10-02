import test from 'node:test';
import assert from 'node:assert/strict';

function setGlobal(t, name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  t.after(() => descriptor ? Object.defineProperty(globalThis, name, descriptor) : delete globalThis[name]);
}

function platform(t, initial = []) {
  let voices = initial;
  const listeners = new Set();
  const spoken = [];
  let cancelCount = 0;
  const synth = {
    getVoices: () => voices,
    speak: utterance => spoken.push(utterance),
    cancel: () => { cancelCount += 1; },
    addEventListener: (name, listener) => { if (name === 'voiceschanged') listeners.add(listener); },
    removeEventListener: (name, listener) => { if (name === 'voiceschanged') listeners.delete(listener); }
  };
  setGlobal(t, 'speechSynthesis', synth);
  setGlobal(t, 'SpeechSynthesisUtterance', class { constructor(text) { this.text = text; } });
  return { synth, spoken, listeners, get cancelCount() { return cancelCount; }, arrive(next) { voices = next; for (const listener of [...listeners]) listener(); } };
}
const us = { name: 'US local', lang: 'en-US', localService: true, default: false };
const uk = { name: 'UK default', lang: 'en-GB', localService: true, default: true };
const flush = () => new Promise(resolve => setImmediate(resolve));

test('cancellation stops pending voice discovery before late arrival', { timeout: 1000 }, async t => {
  const fake = platform(t);
  const messages = [];
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController({ notify: message => messages.push(message) });
  const pending = controller.speak('hello');
  await flush();
  controller.cancel();
  assert.equal((await pending).reason, 'cancelled');
  fake.arrive([us]);
  await flush();
  assert.equal(fake.spoken.length, 0);
  assert.equal(fake.listeners.size, 0);
  assert.equal(messages.length, 0);
  controller.dispose();
});

test('new playback supersedes old playback and stale callbacks cannot report success or errors', { timeout: 1000 }, async t => {
  const fake = platform(t, [us]);
  const statuses = [];
  const messages = [];
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController({ onStatus: status => statuses.push(status), notify: message => messages.push(message) });
  const first = controller.speak('first');
  await flush();
  const oldEnd = fake.spoken[0].onend;
  const oldError = fake.spoken[0].onerror;
  const second = controller.speak('second');
  await flush();
  assert.equal((await first).reason, 'cancelled');
  const count = statuses.length;
  oldEnd(); oldError({ error: 'interrupted' });
  assert.equal(statuses.length, count);
  assert.equal(messages.length, 0);
  fake.spoken[1].onend();
  assert.equal((await second).ok, true);
  assert.ok(fake.cancelCount >= 1);
  controller.dispose();
  assert.equal((await controller.speak('disposed')).reason, 'disposed');
});

test('offline selection uses a local exact voice and never invokes a remote-only service', { timeout: 3000 }, async t => {
  const remote = { ...us, name: 'US remote', localService: false, default: true };
  const fake = platform(t, [remote, uk, us]);
  setGlobal(t, 'navigator', { onLine: false });
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController();
  const pending = controller.speak('offline');
  await flush();
  assert.equal(fake.spoken[0].voice, us);
  fake.spoken[0].onend();
  assert.equal((await pending).ok, true);
  fake.arrive([remote, uk]);
  const missing = await controller.speak('remote');
  assert.equal(missing.reason, 'offline-voice-unavailable');
  assert.equal(fake.spoken.length, 1);
  controller.dispose();
});

test('unsupported synthesis reports a result and visible feedback instead of throwing', async t => {
  setGlobal(t, 'speechSynthesis', undefined);
  setGlobal(t, 'SpeechSynthesisUtterance', undefined);
  const messages = [];
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController({ notify: message => messages.push(message) });
  assert.equal((await controller.speak('hello')).reason, 'unsupported');
  assert.equal(messages.length, 1);
  assert.deepEqual(controller.getVoices(), []);
  controller.dispose();
});

test('disabled and invalid requests do not send speech to the platform', { timeout: 1000 }, async t => {
  const fake = platform(t, [us]);
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController();
  assert.equal((await controller.speak('hello', { enabled: false })).reason, 'disabled');
  assert.equal((await controller.speak('  ')).reason, 'invalid-text');
  assert.equal((await controller.speak('hello', { lang: 'en-AU' })).reason, 'unsupported-accent');
  assert.equal(fake.spoken.length, 0);
  controller.dispose();
});

test('platform errors resolve failure and notify instead of claiming success', async t => {
  const fake = platform(t, [us]);
  const messages = [];
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController({ notify: message => messages.push(message) });
  const pending = controller.speak('hello');
  await flush();
  assert.equal(typeof fake.spoken[0].onerror, 'function');
  fake.spoken[0].onerror({ error: 'network' });
  const result = await pending;
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'network');
  assert.ok(messages.some(message => message.includes('network')));
  fake.synth.speak = () => { throw new Error('device failed'); };
  assert.equal((await controller.speak('again')).reason, 'speech-error');
  controller.dispose();
});

test('missing exact accent times out with visible feedback, never another accent', { timeout: 3000 }, async t => {
  const fake = platform(t, [uk]);
  const messages = [];
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController({ notify: message => messages.push(message) });
  const result = await controller.speak('hello');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'voice-unavailable');
  assert.equal(result.lang, 'en-US');
  assert.equal(fake.spoken.length, 0);
  assert.equal(fake.listeners.size, 0);
  assert.ok(messages.some(message => message.includes('en-US')));
  controller.dispose();
});

test('selects an actual exact accent voice and uses normal/slow rate', async t => {
  const fake = platform(t, [uk, us, { name: 'Generic English', lang: 'en', default: true }]);
  const statuses = [];
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController({ onStatus: status => statuses.push(status) });
  let pending = controller.speak('always');
  await flush();
  assert.equal(fake.spoken[0].voice, us);
  assert.equal(fake.spoken[0].lang, 'en-US');
  assert.equal(fake.spoken[0].rate, 0.85);
  fake.spoken[0].onend();
  assert.deepEqual(await pending, { ok: true, reason: 'completed', voiceName: us.name, lang: 'en-US' });
  pending = controller.speak('water', { lang: 'en-GB', rate: 0.6 });
  await flush();
  assert.equal(fake.spoken[1].voice, uk);
  assert.equal(fake.spoken[1].rate, 0.6);
  fake.spoken[1].onend();
  assert.equal((await pending).lang, 'en-GB');
  assert.deepEqual(controller.getVoices(), [us]);
  assert.ok(statuses.every(s => typeof s.type === 'string' && typeof s.message === 'string' && typeof s.lang === 'string' && typeof s.voiceName === 'string'));
  controller.dispose();
});

test('waits for asynchronously arriving exact accent voices and cleans listener', async t => {
  const fake = platform(t, [uk]);
  const { createSpeechController } = await import('../src/speech.js');
  const controller = createSpeechController();
  const pending = controller.speak('hello');
  await flush();
  assert.equal(fake.spoken.length, 0);
  assert.equal(fake.listeners.size, 1);
  fake.arrive([uk, us]);
  await flush();
  assert.equal(fake.spoken[0].voice, us);
  fake.spoken[0].onend();
  assert.equal((await pending).ok, true);
  assert.equal(fake.listeners.size, 0);
  controller.dispose();
});

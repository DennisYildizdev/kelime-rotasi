import test from 'node:test';
import assert from 'node:assert/strict';

test('PWA registration shows a waiting update without activating it over a lesson', async () => {
  const { registerPwa } = await import('../src/pwa.js');
  const status = {textContent: ''};
  const listeners = {};
  let registrationArgs;
  const registration = {waiting: {}, addEventListener: (event, callback) => {listeners[event] = callback;}};
  await registerPwa({secure: true, status, nav: {serviceWorker: {
    register: async (...args) => {registrationArgs = args; return registration;},
    ready: Promise.resolve(registration)
  }}});
  assert.equal(registrationArgs[0], './sw.js');
  assert.equal(registrationArgs[1].updateViaCache, 'none');
  assert.match(status.textContent, /sekmeleri kapat/i);
});

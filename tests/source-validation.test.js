import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('source validator rejects duplicate IDs and missing provenance', async () => {
  const {validateSource} = await import('../scripts/validate-source.js');
  const data = [{id:'same',word:'a',level:'A1'}, {id:'same',word:'b',level:'A1'}];
  const errors = validateSource(data);
  assert.ok(errors.some(error => error.includes('Duplicate')));
  assert.ok(errors.some(error => error.includes('source')));
});

test('shipped source reconciles all records and preserves every legacy progress ID', async () => {
  const {validateSource} = await import('../scripts/validate-source.js');
  const rows = JSON.parse(await readFile(new URL('../data/words.json', import.meta.url), 'utf8'));
  const report = JSON.parse(await readFile(new URL('../data/source-audit.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateSource(rows), []);
  assert.equal(rows.length, report.sourceCount);
  assert.deepEqual(report.unmappedLegacyIds, []);
  const ids = new Set(rows.map(row => row.id));
  for (const oldId of Object.keys(report.legacyToStable)) assert.ok(ids.has(oldId));
});

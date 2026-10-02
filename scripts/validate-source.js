import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export function validateSource(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return ['Empty or invalid source array'];
  const errors = [], ids = new Set(), stableIds = new Set();
  for (const row of rows) {
    if (!row || typeof row !== 'object') { errors.push('Invalid source record'); continue; }
    if (!row.id || ids.has(row.id)) errors.push(`Duplicate or missing id: ${row.id}`);
    if (!row.stableId || stableIds.has(row.stableId)) errors.push(`Duplicate or missing stableId: ${row.word}`);
    ids.add(row.id); stableIds.add(row.stableId);
    if (typeof row.word !== 'string' || !row.word.trim()) errors.push('Empty headword');
    if (!['A1','A2','B1','B2'].includes(row.level)) errors.push(`Invalid level: ${row.word}`);
    if (!row.source || !Number.isInteger(row.source.page) || row.source.page < 1 || row.source.raw !== row.raw) errors.push(`Invalid source provenance: ${row.word}`);
    if (!Array.isArray(row.senses) || !row.senses.length || row.senses.some(s => !s.partOfSpeech || !['A1','A2','B1','B2'].includes(s.level))) errors.push(`Invalid senses: ${row.word}`);
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = JSON.parse(await readFile(new URL('../data/words.json', import.meta.url), 'utf8'));
  const errors = validateSource(rows);
  const levels = rows.reduce((counts, row) => { counts[row.level] = (counts[row.level] || 0) + 1; return counts; }, {});
  console.log(JSON.stringify({count:rows.length,levels,errors}, null, 2));
  if (errors.length) process.exitCode = 1;
}

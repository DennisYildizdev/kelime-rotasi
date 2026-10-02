import { readFileSync } from 'node:fs';
import { CONTENT_VERSION, joinContent, isEligible, validateContent } from '../src/content.js';

const load = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const words = load('words');
const enrichment = load('enrichment');
const ipa = load('ipa');
const joined = joinContent(words, enrichment);
const errors = validateContent(enrichment);
if (!Array.isArray(ipa) || ipa.some(row => !Array.isArray(row) || row.length !== 3 || row.some(value => typeof value !== 'string' || !value.trim()))) errors.push('ipa: expected non-blank [symbol, label, examples] rows');
const levels = {};
for (const word of joined) {
  levels[word.level] ??= { sourceRecords: 0, eligibleCards: 0, reviewedCards: 0 };
  levels[word.level].sourceRecords += 1;
  if (isEligible(word)) levels[word.level].eligibleCards += 1;
  if (isEligible(word) && word.reviewStatus === 'reviewed') levels[word.level].reviewedCards += 1;
}
console.log(JSON.stringify({
  contentVersion: CONTENT_VERSION,
  sourceRecords: words.length,
  enrichedEntries: Object.keys(enrichment).length,
  eligibleCards: joined.filter(isEligible).length,
  reviewedCards: joined.filter(word => isEligible(word) && word.reviewStatus === 'reviewed').length,
  unmatchedEnrichmentKeys: Object.keys(enrichment).filter(key => !words.some(word => word.word === key || (word.word === 'a,an' && key === 'a, an'))),
  ipaSymbols: ipa.length,
  levels,
  errors
}, null, 2));
if (errors.length) process.exitCode = 1;

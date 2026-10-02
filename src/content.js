export const CONTENT_VERSION = '2';

const nonBlank = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const accents = ['en-US', 'en-GB'];

export function getPronunciation(word, accent = 'en-US') {
  const value = word?.pronunciations?.[accent];
  return { ipa: value?.ipa || '', approxTr: value?.approxTr || '' };
}

function entryErrors(entry, key) {
  if (!object(entry)) return [`${key}: expected an object`];
  const errors = [];
  for (const field of ['translation', 'ipa', 'approxTr', 'example', 'exampleTr']) {
    if (!nonBlank(entry[field])) errors.push(`${key}.${field}: non-blank text required`);
  }
  for (const accent of accents) {
    // US is the required lesson accent. Missing optional UK must remain absent,
    // never be manufactured or silently substituted with the American entry.
    if (accent === 'en-GB' && entry.pronunciations?.[accent] == null) continue;
    for (const field of ['ipa', 'approxTr']) {
      if (!nonBlank(entry.pronunciations?.[accent]?.[field])) errors.push(`${key}.pronunciations.${accent}.${field}: non-blank text required`);
    }
  }
  if (!['draft', 'reviewed', 'rejected'].includes(entry.reviewStatus)) errors.push(`${key}.reviewStatus: invalid status`);
  if (entry.contentVersion !== CONTENT_VERSION) errors.push(`${key}.contentVersion: expected ${CONTENT_VERSION}`);
  if (!Array.isArray(entry.topicTags) || !entry.topicTags.length || !entry.topicTags.every(nonBlank)) errors.push(`${key}.topicTags: non-blank tags required`);
  if (!Array.isArray(entry.provenance) || !entry.provenance.length) errors.push(`${key}.provenance: required`);
  else entry.provenance.forEach((source, index) => {
    for (const field of ['source', 'scope', 'note']) {
      if (!nonBlank(source?.[field])) errors.push(`${key}.provenance[${index}].${field}: non-blank text required`);
    }
  });
  return errors;
}

export function validateContent(enrichment) {
  if (!object(enrichment)) return ['enrichment: expected a headword-keyed object'];
  return Object.entries(enrichment).flatMap(([key, value]) => [
    ...(!nonBlank(key) ? ['enrichment: blank headword'] : []),
    ...entryErrors(value, key)
  ]);
}

// Eligibility means structurally complete lesson content, NOT human/editorial approval.
export function isEligible(word) {
  return word?.eligible === true && word.reviewStatus !== 'rejected' && entryErrors(word, word.word || 'word').length === 0;
}

export function joinContent(words, enrichment = {}) {
  if (!Array.isArray(words)) return [];
  if (!object(enrichment)) enrichment = {};
  const headword = word => word === 'a,an' ? 'a, an' : word;
  const counts = new Map();
  for (const source of words) {
    const key = headword(source.word);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return words.map(source => {
    // Only the known combined-article spacing alias is normalized.
    const key = headword(source.word);
    const extra = Object.hasOwn(enrichment, key) ? enrichment[key] : undefined;
    if (!object(extra) || (counts.get(key) > 1 && extra.sourceId !== source.id) || (extra.sourceId && extra.sourceId !== source.id) || (extra.sourceLevel && extra.sourceLevel !== source.level)) {
      return { ...source, eligible: false };
    }
    const pronunciation = getPronunciation(extra);
    const result = { ...extra, ...pronunciation, ...source };
    result.eligible = extra.reviewStatus !== 'rejected' && entryErrors(extra, key).length === 0;
    return result;
  });
}

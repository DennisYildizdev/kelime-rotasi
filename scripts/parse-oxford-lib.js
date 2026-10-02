const POS_PATTERN = /\b(indefinite article|definite article|infinitive marker|auxiliary v\.|modal v\.|number|adj\.|adv\.|n\.|v\.|prep\.|pron\.|det\.|conj\.|exclam\.)/i;
const LEVEL_PATTERN = /\b(A1|A2|B1|B2)\b/g;

export function parseEntry(value) {
  const raw = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!raw || !/\b(?:A1|A2|B1|B2)\b/.test(raw)) return null;
  if (/Oxford|University Press|\d+\s*\/\s*11/i.test(raw)) return null;

  const posMatch = raw.match(POS_PATTERN);
  const levels = [...raw.matchAll(LEVEL_PATTERN)];
  if (!posMatch || levels.length === 0) return null;

  const word = raw.slice(0, posMatch.index).trim().replace(/[©�]+/g, '').trim();
  if (!word || word.length > 48) return null;

  return {
    word,
    partOfSpeech: posMatch[0],
    level: levels[0][1],
    raw
  };
}

export function parseLayoutText(text) {
  const entries = [];
  const seen = new Set();
  const lines = String(text ?? '').split(/\r?\n/);

  for (const line of lines) {
    const columns = line.replace(/^\f/, '').split(/\s{2,}/).map(value => value.trim()).filter(Boolean);
    for (const column of columns) {
      const entry = parseEntry(column);
      if (!entry) continue;
      const key = `${entry.word.toLowerCase()}|${entry.level}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(entry);
    }
  }

  return entries;
}

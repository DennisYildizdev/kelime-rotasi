import { readFile, writeFile } from 'node:fs/promises';
import { parseLayoutText } from './parse-oxford-lib.js';

const source = new URL('../data/oxford3000.txt', import.meta.url);
const target = new URL('../data/words.json', import.meta.url);
const text = await readFile(source, 'utf8');
const words = parseLayoutText(text).map((entry, index) => ({
  id: `${entry.word.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
  ...entry
}));

await writeFile(target, `${JSON.stringify(words, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output: target.pathname, count: words.length }));

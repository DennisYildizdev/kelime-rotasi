import {readFile,writeFile,readdir,mkdir,rm} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

export async function buildWeb({source,destination}) {
  const files = ['index.html','styles.css','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','_headers','sw.js',
    'data/words.json','data/enrichment.json','data/ipa.json', 'LICENSE', 'THIRD-PARTY-NOTICES.md',
    'licenses/ipa-dict-MIT.txt', 'licenses/cmudict-ipa-MIT.txt', 'licenses/ipacards-GPL-3.0.txt', 'licenses/WikDict-CC-BY-SA-4.0.txt'];
  for (const entry of await readdir(join(source,'src'),{withFileTypes:true})) {
    if(entry.isFile() && entry.name.endsWith('.js')) files.push('src/'+entry.name);
  }
  const buffers = new Map(); const hash = createHash('sha256');
  for(const file of files.sort()) {
    // Large data files ship pretty-printed in the repo for review diffs; the
    // deployed copy is minified to cut the offline precache payload. Parse and
    // re-serialize so malformed JSON fails the build instead of shipping.
    if(file.startsWith('data/') && file.endsWith('.json')) {
      const parsed = JSON.parse(await readFile(join(source,file),'utf8'));
      buffers.set(file,Buffer.from(JSON.stringify(parsed)));
    } else {
      buffers.set(file,await readFile(join(source,file)));
    }
    hash.update(file); hash.update(buffers.get(file));
  }
  const version = 'kelime-rotasi-' + hash.digest('hex').slice(0,16);
  let sw = buffers.get('sw.js').toString('utf8');
  sw = sw.replace(/const CACHE = '[^']+';/,`const CACHE = '${version}';`);
  const assets = ['./',...files.filter(file => !['sw.js','_headers'].includes(file)).map(file=>'./'+file)];
  sw = sw.replace(/const ASSETS = \[[\s\S]*?\];/,`const ASSETS = ${JSON.stringify(assets,null,2)};`);
  buffers.set('sw.js',Buffer.from(sw));
  // Refuse to clean an arbitrary folder; only a child named dist is generated.
  if(resolve(destination) !== resolve(source,'dist') && dirname(resolve(destination)) !== dirname(resolve(source))) throw new Error('Unsafe output path');
  if(!['dist'].includes(resolve(destination).split(/[\\/]/).at(-1))) throw new Error('Output must be named dist');
  await rm(destination,{recursive:true,force:true});
  for(const [file,bytes] of buffers) {
    await mkdir(dirname(join(destination,file)),{recursive:true});
    await writeFile(join(destination,file),bytes);
  }
  return {version,files:files.length,destination};
}

if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = fileURLToPath(new URL('../',import.meta.url));
  console.log(JSON.stringify(await buildWeb({source,destination:join(source,'dist')}),null,2));
}

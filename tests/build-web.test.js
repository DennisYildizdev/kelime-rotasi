import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';

test('web build only publishes runtime assets and fingerprints changes', async () => {
  const {buildWeb} = await import('../scripts/build-web.js');
  const root = await mkdtemp(join(process.env.TMPDIR || 'C:/Users/PC/AppData/Local/hermes/cache/scratch', 'kr-web-test-'));
  try {
    const source = join(root,'source'); const destination = join(root,'dist');
    await mkdir(join(source,'src'),{recursive:true}); await mkdir(join(source,'data'));
    for(const file of ['index.html','styles.css','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','_headers']) await writeFile(join(source,file),'fixture');
    await writeFile(join(source,'sw.js'),"const CACHE = 'kelime-rotasi-v2';\nconst ASSETS = ['./'];\n");
    await writeFile(join(source,'src','app.js'),'export const ok=true;');
    for(const file of ['words.json','enrichment.json','ipa.json']) await writeFile(join(source,'data',file),'[]');
    await writeFile(join(source,'Implement.md'),'private notes');
    await writeFile(join(source,'.env'),'secret');
    await writeFile(join(source,'data','source-audit.json'),'not runtime');
    await mkdir(join(source,'licenses'));
    await writeFile(join(source,'LICENSE'),'MIT License\n\nCopyright (c) 2026 DennisYildizdev\n');
    await writeFile(join(source,'THIRD-PARTY-NOTICES.md'),'Data source attribution');
    for (const name of ['ipa-dict-MIT.txt','cmudict-ipa-MIT.txt','ipacards-GPL-3.0.txt','WikDict-CC-BY-SA-4.0.txt']) await writeFile(join(source,'licenses',name),'License text');
    const first = await buildWeb({source,destination});
    assert.match(await readFile(join(destination,'LICENSE'),'utf8'),/Copyright \(c\) 2026 DennisYildizdev/);
    assert.equal(await readFile(join(destination,'THIRD-PARTY-NOTICES.md'),'utf8'),'Data source attribution');
    assert.equal((await readdir(join(destination,'licenses'))).length,4);
    assert.ok((await readdir(destination)).includes('index.html'));
    assert.equal((await readdir(destination)).includes('.env'),false);
    assert.equal((await readdir(destination)).includes('Implement.md'),false);
    assert.equal((await readdir(join(destination,'data'))).includes('source-audit.json'),false);
    await writeFile(join(source,'styles.css'),'changed');
    const second = await buildWeb({source,destination});
    assert.notEqual(first.version,second.version);
    assert.match(await readFile(join(destination,'sw.js'),'utf8'),new RegExp(second.version));
  } finally {await rm(root,{recursive:true,force:true});}
});

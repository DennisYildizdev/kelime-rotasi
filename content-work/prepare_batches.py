from pathlib import Path
import json, sqlite3, re, hashlib
ROOT=Path(__file__).resolve().parent.parent
work=ROOT/'content-work'
refs=work/'references'
words=json.loads((ROOT/'data/words.json').read_text(encoding='utf-8'))
old=json.loads((ROOT/'data/enrichment.json').read_text(encoding='utf-8'))
ipa={}
for accent,file in [('en-US','en_US.txt'),('en-GB','en_UK.txt')]:
    ipa[accent]={line.split('\t')[0]:line.split('\t')[1] for line in (refs/file).read_text(encoding='utf-8').splitlines() if '\t' in line}
con=sqlite3.connect(refs/'en-tr.sqlite3')
rows=[]
for w in words:
    if w['level']!='A1': continue
    # Explicit lookup alias only: original source headword/id are never changed.
    lemma=re.sub(r'\d+$','', w['word'].split(' (')[0]).replace('’',"'")
    if lemma=='a, an': lemma='a'
    candidates=con.execute('SELECT lexentry,sense,trans_list,score FROM translation WHERE written_rep=? ORDER BY score DESC',(lemma,)).fetchall()
    if not candidates and lemma.lower()!=lemma:
        candidates=con.execute('SELECT lexentry,sense,trans_list,score FROM translation WHERE written_rep=? ORDER BY score DESC',(lemma.lower(),)).fetchall()
    candidates=[{'entry':r[0],'sense':r[1],'translations':r[2],'score':r[3]} for r in candidates[:16]]
    r={'id':w['id'],'headword':w['word'],'lookupLemma':lemma,'pos':w['partOfSpeech'],'senses':w['senses'], 'ipaCandidates':{a:d.get(lemma.lower(),d.get(lemma,'')) for a,d in ipa.items()},'dictionaryCandidates':candidates}
    if w['word'] in old: r['existing']=old[w['word']]
    rows.append(r)
(work/'inputs').mkdir(exist_ok=True)
(work/'batches').mkdir(exist_ok=True)
(work/'reviews').mkdir(exist_ok=True)
for n in range(9):
    p=work/'inputs'/f'batch-{n+1:02}.json'
    p.write_text(json.dumps(rows[n*100:(n+1)*100],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(work/'evidence.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'total':len(rows),'batchSizes':[len(rows[n*100:(n+1)*100]) for n in range(9)],'missingUS':[r['headword'] for r in rows if not r['ipaCandidates']['en-US']],'missingUK':[r['headword'] for r in rows if not r['ipaCandidates']['en-GB']],'noTranslationCandidates':[r['headword'] for r in rows if not r['dictionaryCandidates']], 'referenceSha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in refs.iterdir() if p.is_file()}}
(work/'reference-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))

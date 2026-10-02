"""Validate authored A1 batches and build staged enrichment; never publish partially."""
from pathlib import Path
import argparse
import collections
import json
import re

ROOT = Path(__file__).resolve().parent.parent
TAGS = set('daily-life people family food home travel school work time numbers nature body clothes feelings actions descriptions communication function-words technology culture sport places money'.split())
REQUIRED = 'sourceId headword displayWord speechText translation example exampleTr ipaUS approxUS selectedSense translationEvidence ipaEvidenceUS'.split()

def validate_rows(rows, sources, evidence):
    expected = {s['id']: s for s in sources if s['level'] == 'A1'}
    proofs = {e['id']: e for e in evidence}
    errors = []
    counts = collections.Counter(r.get('sourceId') for r in rows)
    missing = set(expected) - set(counts)
    unexpected = set(counts) - set(expected)
    if missing: errors.append('Missing IDs: ' + ', '.join(sorted(missing)))
    if unexpected: errors.append('Unexpected IDs: ' + ', '.join(map(str, unexpected)))
    if any(n != 1 for n in counts.values()): errors.append('Duplicate source IDs')
    example_counts = collections.Counter(r.get('example', '').strip().casefold() for r in rows if isinstance(r.get('example'), str) and r['example'].strip())
    for example, count in example_counts.items():
        if count > 1: errors.append(f'Reused example across {count} cards: {example}')
    for r in rows:
        key = r.get('sourceId', '?')
        def error(text): errors.append(f'{key}: {text}')
        for field in REQUIRED:
            if not isinstance(r.get(field), str) or not r[field].strip(): error(f'{field} is missing/blank')
        if key not in expected or key not in proofs: continue
        source, proof = expected[key], proofs[key]
        if r.get('headword') != source['word']: error('source headword changed')
        display = r.get('displayWord', '')
        if display:
            pattern = r'(?<![\w])' + re.escape(display) + r'(?![\w])'
            if not re.search(pattern, r.get('example', ''), re.IGNORECASE): error('example lacks exact target')
        tags = r.get('topicTags')
        if not isinstance(tags, list) or not tags or any(t not in TAGS for t in tags): error('topicTags invalid')
        for accent, suffix, source_prefix in [('en-US', 'US', 'ipa-dict/en_US:'), ('en-GB', 'UK', 'ipa-dict/en_UK:')]:
            ipa, approx = r.get('ipa'+suffix, ''), r.get('approx'+suffix, '')
            origin = r.get('ipaEvidence'+suffix, '')
            if accent == 'en-GB' and not ipa and not approx: continue
            if not ipa or not approx: error(f'{accent} pair incomplete'); continue
            if not isinstance(ipa, str) or not re.fullmatch(r'/[^/\n]+/', ipa): error(f'{accent} requires one slash-delimited IPA')
            if origin.startswith(source_prefix):
                candidates = re.findall(r'/[^/]+/', proof.get('ipaCandidates', {}).get(accent, ''))
                if ipa not in candidates: error(f'{accent} IPA is not a supplied candidate')
            elif origin == 'legacy-pilot':
                old = proof.get('existing', {}).get('pronunciations', {}).get(accent, {})
                if ipa != old.get('ipa'): error(f'{accent} legacy evidence mismatch')
            elif not origin.startswith('https://'): error(f'{accent} missing retrievable evidence')
        trans_evidence = r.get('translationEvidence', '')
        entries = {x['entry'] for x in proof.get('dictionaryCandidates', [])}
        if trans_evidence not in entries and not trans_evidence.startswith('https://'): error('translation evidence not in supplied candidates')
        if source['word'] == 'always' and r.get('approxUS') != 'ool-veyz': error('approved always reading changed')
    return errors

def make_enrichment(rows, sources, evidence):
    errors = validate_rows(rows, sources, evidence)
    if errors: raise ValueError('\n'.join(errors))
    by_id = {r['sourceId']: r for r in rows}
    result = {}
    for source in sources:
        if source['level'] != 'A1': continue
        r = by_id[source['id']]
        pronunciations = {'en-US': {'ipa': r['ipaUS'], 'approxTr': r['approxUS']}}
        if r.get('ipaUK'): pronunciations['en-GB'] = {'ipa': r['ipaUK'], 'approxTr': r['approxUK']}
        origins = [
            {'source': 'WikDict / Wiktionary / DBnary; https://www.wikdict.com/en-tr/', 'scope': 'Turkish meaning cross-check; ' + r['translationEvidence'], 'note': 'Sense and POS selected for this source record. Community dictionary evidence is not human editorial approval of this card.'},
            {'source': 'https://github.com/open-dict-data/ipa-dict; ' + r['ipaEvidenceUS'], 'scope': 'en-US IPA', 'note': 'CMU-based open pronunciation data when ipa-dict is named; otherwise the recorded dictionary URL. Variant selected for the taught sense.'},
            {'source': 'AI-assisted original authoring', 'scope': 'example, exampleTr, approximate reading, selected sense and topic tags', 'note': 'Authored per entry and structurally checked. Not human-reviewed; approximate reading is not IPA.'}
        ]
        if r.get('ipaUK'):
            origins.append({'source': r['ipaEvidenceUK'], 'scope': 'en-GB IPA', 'note': 'Optional UK pronunciation. ipa-dict UK data derives from GPL-3.0 ipacards; legacy-pilot remains an unreviewed editorial draft.'})
        card = {
            'sourceId': source['id'], 'sourceLevel': 'A1', 'displayWord': r['displayWord'], 'speechText': r['speechText'],
            'translation': r['translation'], 'ipa': r['ipaUS'], 'approxTr': r['approxUS'],
            'example': r['example'], 'exampleTr': r['exampleTr'], 'pronunciations': pronunciations,
            'topicTags': r['topicTags'], 'selectedSense': r['selectedSense'], 'reviewStatus': 'draft',
            'contentVersion': '2', 'contentRelease': 'a1-expanded-1', 'provenance': origins,
            'qualityChecks': {'sourceMapped': True, 'requiredFields': True, 'exampleContainsTarget': True, 'humanReviewed': False},
            'approxDisclaimer': 'Türkçe yaklaşık okunuş yardımcıdır; IPA ve sesin yerine geçmez. İngilizcedeki bazı seslerin Türkçede tam karşılığı yoktur. İçerik editoryal inceleme bekliyor.'
        }
        if r.get('contentNote'): card['contentNote'] = r['contentNote']
        if r.get('acceptedAnswers'): card['acceptedAnswers'] = r['acceptedAnswers']
        result[source['word']] = card
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='content-work/enrichment.staged.json')
    args = parser.parse_args()
    sources = json.loads((ROOT/'data/words.json').read_text(encoding='utf-8'))
    evidence = json.loads((ROOT/'content-work/evidence.json').read_text(encoding='utf-8'))
    paths = [ROOT/'content-work/batches'/f'batch-{n:02}.json' for n in range(1, 10)]
    absent = [str(p) for p in paths if not p.exists()]
    if absent: raise SystemExit('Missing batches; nothing written: ' + ', '.join(absent))
    rows = []
    for path in paths:
        batch = json.loads(path.read_text(encoding='utf-8-sig'))
        if not isinstance(batch, list) or len(batch) != 100: raise SystemExit(f'{path}: expected 100 records')
        rows.extend(batch)
    data = make_enrichment(rows, sources, evidence)
    output = ROOT/args.output
    if output.resolve() == (ROOT/'data/enrichment.json').resolve(): raise SystemExit('Stage first; do not overwrite active data with this tool')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'output':str(output),'records':len(data),'us':len(data),'uk':sum('en-GB' in c['pronunciations'] for c in data.values()),'reviewed':0}, ensure_ascii=False))

if __name__ == '__main__': main()

"""Prepare bounded, evidence-carrying authoring inputs for A2/B1/B2 lesson cards.

Mirrors the proven A1 flow (content-work/prepare_batches.py) and adds:
  * per-level batching instead of one A1-only stream,
  * base-form lookup fallback for derived words (evidence lookup only),
  * explicit external-evidence slots for words the offline snapshots cannot source.

Source IDs, headwords and levels are never modified: lookupLemma is an evidence
helper only, exactly like the A1 contract states.
"""
from pathlib import Path
import argparse
import collections
import hashlib
import json
import re
import sqlite3

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'content-work'
REFS = WORK / 'references'
LEVELS = ('A2', 'B1', 'B2')


def lemma_for(word):
    """Base lookup lemma: strip homograph numbers and sense parentheticals."""
    lemma = re.sub(r'\d+$', '', word.split(' (')[0]).replace('’', "'")
    return lemma


def base_candidates(lemma):
    """Deterministic base forms to try when the exact form is absent."""
    out, seen = [], set()

    def add(value):
        if value and value not in seen:
            seen.add(value)
            out.append(value)

    add(lemma)
    low = lemma.lower()
    for suffix, tail in (('ied', 'y'), ('ied', 'e'), ('ing', 'e'), ('ed', 'e'), ('ly', ''), ('es', ''), ('s', ''), ('d', '')):
        if low.endswith(suffix) and len(low) > len(suffix) + 2:
            stem = low[: -len(suffix)]
            add(stem)
            add(stem + tail)
            if suffix in ('ed', 'ing') and len(stem) > 2 and stem[-1] == stem[-2]:
                add(stem[:-1])
    return out


def translation_candidates(cursor, lemma, limit=12):
    """WikDict evidence for the exact form first, then the first base form that hits."""
    for lookup in base_candidates(lemma):
        rows = cursor.execute(
            'SELECT lexentry,sense,trans_list,score FROM translation WHERE written_rep=? ORDER BY score DESC',
            (lookup,),
        ).fetchall()
        if rows:
            return lookup, [
                {'entry': r[0], 'sense': r[1], 'translations': r[2], 'score': r[3]} for r in rows[:limit]
            ]
    return lemma, []


def ipa_maps():
    maps = {}
    for accent, filename in (('en-US', 'en_US.txt'), ('en-GB', 'en_UK.txt')):
        maps[accent] = {
            line.split('\t')[0]: line.split('\t')[1]
            for line in (REFS / filename).read_text(encoding='utf-8').splitlines()
            if '\t' in line
        }
    return maps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--levels', nargs='+', default=list(LEVELS))
    parser.add_argument('--batch-size', type=int, default=100)
    parser.add_argument('--external', default='content-work/external-evidence.json')
    parser.add_argument('--evidence', default='content-work/evidence-a2b1b2.json')
    parser.add_argument('--report', default='content-work/level-report.json')
    args = parser.parse_args()

    words = json.loads((ROOT / 'data/words.json').read_text(encoding='utf-8'))
    external_path = ROOT / args.external
    external = json.loads(external_path.read_text(encoding='utf-8')) if external_path.exists() else {}
    ipa = ipa_maps()
    connection = sqlite3.connect(REFS / 'en-tr.sqlite3')
    cursor = connection.cursor()

    records, report = [], collections.Counter()
    gaps = collections.defaultdict(list)
    for word in words:
        if word['level'] not in args.levels:
            continue
        lemma = lemma_for(word['word'])
        lookup, candidates = translation_candidates(cursor, lemma)
        us = ipa['en-US'].get(lemma.lower(), ipa['en-US'].get(lemma, ''))
        uk = ipa['en-GB'].get(lemma.lower(), ipa['en-GB'].get(lemma, ''))
        record = {
            'sourceId': word['id'],
            'headword': word['word'],
            'level': word['level'],
            'raw': word['raw'],
            'pos': word['partOfSpeech'],
            'senses': word.get('senses', []),
            'sourcePage': (word.get('source') or {}).get('page'),
            'displayWordHint': lemma,
            'translationLookup': lookup,
            'ipaCandidates': {'en-US': us, 'en-GB': uk},
            'dictionaryCandidates': candidates,
        }
        evidence = external.get(word['id'])
        if evidence:
            record['externalEvidence'] = evidence
        needs = []
        if not (record.get('externalEvidence', {}).get('ipa', {}).get('en-US') or us):
            needs.append('no-en-US-IPA-candidate')
        if not (record.get('externalEvidence', {}).get('translations') or candidates):
            needs.append('no-translation-candidate')
        record['needsExternal'] = needs
        if needs:
            gaps[word['level']].append({'sourceId': word['id'], 'headword': word['word'], 'needs': needs})
        report[f"{word['level']}.total"] += 1
        if us or record.get('externalEvidence', {}).get('ipa', {}).get('en-US'):
            report[f"{word['level']}.usIPA"] += 1
        if uk or record.get('externalEvidence', {}).get('ipa', {}).get('en-GB'):
            report[f"{word['level']}.ukIPA"] += 1
        if candidates or record.get('externalEvidence', {}).get('translations'):
            report[f"{word['level']}.translation"] += 1
        records.append(record)

    inputs = WORK / 'inputs'
    for directory in (inputs, WORK / 'batches', WORK / 'reviews'):
        directory.mkdir(exist_ok=True)

    by_level = collections.defaultdict(list)
    for record in records:
        by_level[record['level']].append(record)

    manifest = {}
    for level, rows in sorted(by_level.items()):
        for index in range(0, len(rows), args.batch_size):
            chunk = rows[index : index + args.batch_size]
            name = f"{level.lower()}-{index // args.batch_size + 1:02}"
            path = inputs / f'{name}.json'
            path.write_text(json.dumps(chunk, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            manifest.setdefault(level, []).append({'file': name, 'records': len(chunk)})

    (ROOT / args.evidence).write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    summary = {
        'levels': args.levels,
        'batchSize': args.batch_size,
        'batches': manifest,
        'counts': dict(sorted(report.items())),
        'gapsNeedingExternalEvidence': {k: v for k, v in sorted(gaps.items())},
        'externalEvidenceApplied': sorted(external.keys()),
        'referenceSha256': {
            p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in REFS.iterdir() if p.is_file()
        },
    }
    (ROOT / args.report).write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'records': len(records), 'counts': dict(sorted(report.items())),
                      'gaps': {k: len(v) for k, v in sorted(gaps.items())}}, ensure_ascii=False))


if __name__ == '__main__':
    main()
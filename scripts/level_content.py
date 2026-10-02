"""Validate authored A2/B1/B2 batches and build staged enrichment; never publish partially.

Level-general sibling of scripts/a1_content.py. The A1 tool is deliberately left
untouched so its 900/900 claim keeps its own independent gate. This module reuses
the same rules and adds what the new levels need:

  * per-level ID coverage instead of a single A1 expectation,
  * external dictionary evidence (real retrieved URL) for words the offline
    snapshots cannot source,
  * a whole-corpus duplicate-example check across every level, since separate
    authors can independently produce the same sentence.

Source IDs, headwords and levels are never rewritten. Lookup aliases are evidence
helpers only.
"""
from pathlib import Path
import argparse
import collections
import json
import re

ROOT = Path(__file__).resolve().parent.parent
TAGS = set('daily-life people family food home travel school work time numbers nature body clothes feelings actions descriptions communication function-words technology culture sport places money'.split())
REQUIRED = 'sourceId headword displayWord speechText translation example exampleTr ipaUS approxUS selectedSense translationEvidence ipaEvidenceUS'.split()
ACCENTS = (('en-US', 'US', 'ipa-dict/en_US:'), ('en-GB', 'UK', 'ipa-dict/en_UK:'))


# A Turkish approximate reading must be written in Turkish orthography
# (the approved style: always -> ool-veyz). Reproducing the IPA teaches nothing,
# so symbols that Turkish does not use as letters are rejected. Letters Turkish
# shares with the IPA (c, s, z, g, j) are legitimate Turkish spelling.
FOREIGN_SYMBOLS = set(
    'ɑɐɒæɓʙβɔɕʄɖðʤəɘɚɛɜɝɞɟʠʡʢɣɤʥɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɻɽɾʀʁʂʃʈʧʉʊʋⱱʌʍχʎʏʑʐʒʔǀǁǂǃˈˌːˑʰʱʲʷˠˤ˞'
)
FOREIGN_WORDS = re.compile(
    r'(?<![\w-])(?:ee|oo|ea|ou|ai|ay|aw|ew|ie|ei|ue|ui)(?![\w-])', re.IGNORECASE
)
# 'ay', 'al', 'sa', 'ya' and friends are ordinary Turkish words; a bare
# single-token reading is not an English digraph spelling.
TURKISH_WORDS = {'ay', 'al', 'sa', 'ya', 'yap', 'gibi', 'ey', 'eı'}

APPROVED_READINGS = set()
try:
    _active = json.loads((ROOT / 'data/enrichment.json').read_text(encoding='utf-8'))
    APPROVED_READINGS = {
        c.get('approxTr', '').strip().casefold() for c in _active.values()
        if isinstance(c, dict) and c.get('approxTr')
    }
except Exception:  # noqa: BLE001 - the rule degrades, it must not crash
    APPROVED_READINGS = set()


def approx_errors(value):
    """Return problems with a Turkish approximate reading, or [] when fine."""
    problems = []
    if not isinstance(value, str) or not value.strip():
        return problems
    if value != value.casefold() or not re.fullmatch(r'[a-zçğıöşü-]+', value):
        problems.append(
            'approximate reading must use lowercase Turkish-readable letters and hyphens only'
        )
    foreign = sorted(set(value) & FOREIGN_SYMBOLS)
    if foreign:
        problems.append(f'approximate reading contains non-Turkish IPA symbols {"".join(foreign)}')
    # A bare token that is also a real Turkish word, or an approved reading in
    # the A1 corpus, is not an English digraph spelling.
    bare = '-' not in value.strip()
    token = value.strip().casefold()
    if (bare and token in TURKISH_WORDS) or token in APPROVED_READINGS:
        return problems
    if FOREIGN_WORDS.search(value):
        problems.append(f'approximate reading uses English digraph spelling: {value!r}')
    if any(mark in value for mark in ('ˈ', 'ˌ', '[', ']', ':', ';')):
        problems.append(f'approximate reading contains IPA notation: {value!r}')
    return problems


def candidates_of(proof, accent):
    return re.findall(r'/[^/]+/', str((proof.get('ipaCandidates') or {}).get(accent, '')))


def external_of(proof, accent):
    return ((proof.get('externalEvidence') or {}).get('ipa') or {}).get(accent) or None


def validate_rows(rows, sources, evidence, levels=('A2', 'B1', 'B2'), seen_examples=None):
    """Validate authored rows against the frozen source inventory and evidence.

    seen_examples maps an already-lowercased example sentence to the card that
    owns it, so reuse across authors/batches is caught globally.
    """
    wanted = set(levels)
    expected = {s['id']: s for s in sources if s['level'] in wanted}
    proofs = {e.get('id') or e['sourceId']: e for e in evidence}
    errors = []
    seen = dict(seen_examples or {})
    counts = collections.Counter(r.get('sourceId') for r in rows)
    missing = set(expected) - set(counts)
    unexpected = set(counts) - set(expected)
    if missing:
        errors.append('Missing IDs: ' + ', '.join(sorted(missing)))
    if unexpected:
        errors.append('Unexpected IDs: ' + ', '.join(map(str, sorted(unexpected))))
    if any(n != 1 for n in counts.values()):
        errors.append('Duplicate source IDs')

    local = collections.Counter(
        r.get('example', '').strip().casefold() for r in rows
        if isinstance(r.get('example'), str) and r['example'].strip()
    )
    for example, count in local.items():
        if count > 1:
            errors.append(f'Reused example across {count} cards: {example}')
    # Ownership is recorded even for rows whose ID is later rejected, so a
    # duplicate cannot slip through by pairing a valid ID with an invalid one.
    for r in rows:
        example = str(r.get('example', '')).strip().casefold()
        if not example:
            continue
        if example in seen:
            owner = seen[example]
            errors.append(f"Reused example already owned by {owner}: {example}")
        else:
            seen[example] = r.get('sourceId', '?')

    for r in rows:
        key = r.get('sourceId', '?')

        def error(text):
            errors.append(f'{key}: {text}')

        for field in REQUIRED:
            if not isinstance(r.get(field), str) or not r[field].strip():
                error(f'{field} is missing/blank')
        if key not in expected or key not in proofs:
            continue
        source, proof = expected[key], proofs[key]
        if r.get('headword') != source['word']:
            error('source headword changed')
        display = r.get('displayWord', '')
        if display:
            pattern = r'(?<![\w])' + re.escape(display) + r'(?![\w])'
            if not re.search(pattern, r.get('example', ''), re.IGNORECASE):
                error('example lacks exact target')
        tags = r.get('topicTags')
        if not isinstance(tags, list) or not tags or any(t not in TAGS for t in tags):
            error('topicTags invalid')
        for accent, suffix, source_prefix in ACCENTS:
            ipa, approx = r.get('ipa' + suffix, ''), r.get('approx' + suffix, '')
            origin = r.get('ipaEvidence' + suffix, '')
            if accent == 'en-GB' and not ipa and not approx:
                # An absent optional accent is legitimate; 'unavailable' is the
                # explicit way to say the author checked and found no evidence.
                if origin not in ('', 'unavailable'):
                    error('en-GB absent but evidence claims a source')
                continue
            if not ipa or not approx:
                # Allowed only when the source needed external evidence and the
                # parent has since retrieved it for this accent.
                fetched = external_of(proof, accent)
                if not (accent == 'en-US' and not ipa and not approx and fetched):
                    error(f'{accent} pair incomplete')
                    continue
                origin = 'external-dictionary'
            for problem in approx_errors(approx):
                error(f'{accent} approximate reading: {problem}')
            if not isinstance(ipa, str) or not re.fullmatch(r'/[^/\n]+/', ipa):
                error(f'{accent} requires one slash-delimited IPA')
                continue
            valid_ipa_dict_origin = origin.startswith(source_prefix) or (
                accent == 'en-GB' and origin.startswith('ipa-dict/en_GB:')
            )
            if valid_ipa_dict_origin:
                if ipa not in candidates_of(proof, accent):
                    error(f'{accent} IPA is not a supplied candidate')
            elif origin == 'external-dictionary':
                # Only accepted when the parent actually retrieved it into evidence.
                fetched = external_of(proof, accent)
                if not fetched:
                    error(f'{accent} claims external evidence but none was retrieved')
                elif ipa != fetched.get('ipa'):
                    error(f'{accent} IPA does not match the retrieved dictionary value')
            else:
                error(f'{accent} missing retrievable evidence')
        trans_evidence = r.get('translationEvidence', '')
        entries = {x['entry'] for x in proof.get('dictionaryCandidates', [])}
        if trans_evidence not in entries:
            if trans_evidence.startswith('https://'):
                fetched = ((proof.get('externalEvidence') or {}).get('translations') or {})
                if fetched.get('sourceUrl') != trans_evidence:
                    error('translation evidence URL is not the retrieved one')
            else:
                error('translation evidence not in supplied candidates')
    return errors


def make_enrichment(rows, sources, evidence, levels=('A2', 'B1', 'B2'), seen_examples=None, content_release=None):
    """Build headword-keyed cards for the given levels after validation."""
    errors = validate_rows(rows, sources, evidence, levels, seen_examples)
    if errors:
        raise ValueError('\n'.join(errors))
    by_id = {r['sourceId']: r for r in rows}
    result = {}
    release = content_release or ('ab-expanded-1')
    for source in sources:
        if source['level'] not in levels:
            continue
        r = by_id[source['id']]
        level = source['level']
        pronunciations = {'en-US': {'ipa': r['ipaUS'], 'approxTr': r['approxUS']}}
        if r.get('ipaUK'):
            pronunciations['en-GB'] = {'ipa': r['ipaUK'], 'approxTr': r['approxUK']}
        external = (proofs_external(r, evidence))
        origins = [
            {'source': 'WikDict / Wiktionary / DBnary; https://www.wikdict.com/en-tr/',
             'scope': 'Turkish meaning cross-check; ' + r['translationEvidence'],
             'note': 'Sense and POS selected for this source record. Community dictionary evidence is not human editorial approval of this card.'},
            {'source': 'https://github.com/open-dict-data/ipa-dict; ' + r['ipaEvidenceUS'],
             'scope': 'en-US IPA',
             'note': 'CMU-based open pronunciation data when ipa-dict is named; otherwise the recorded dictionary URL. Variant selected for the taught sense.'},
            {'source': 'AI-assisted original authoring',
             'scope': 'example, exampleTr, approximate reading, selected sense and topic tags',
             'note': 'Authored per entry and structurally checked. Not human-reviewed; approximate reading is not IPA.'},
        ]
        if r.get('ipaUK'):
            origins.append({
                'source': r['ipaEvidenceUK'],
                'scope': 'en-GB IPA',
                'note': 'Optional UK pronunciation. ipa-dict UK data derives from GPL-3.0 ipacards; externally retrieved values are not human-reviewed.'})
        if external:
            origins.append({'source': external['summary'], 'scope': external['scope'],
                            'note': 'Retrieved from a public dictionary page because the offline snapshot had no candidate. Not human-reviewed.'})
        card = {
            'sourceId': source['id'],
            'sourceLevel': level,
            'displayWord': r['displayWord'],
            'speechText': r['speechText'],
            'translation': r['translation'],
            'ipa': r['ipaUS'],
            'approxTr': r['approxUS'],
            'example': r['example'],
            'exampleTr': r['exampleTr'],
            'pronunciations': pronunciations,
            'topicTags': r['topicTags'],
            'selectedSense': r['selectedSense'],
            'reviewStatus': 'draft',
            'contentVersion': '2',
            'contentRelease': release,
            'provenance': origins,
            'qualityChecks': {'sourceMapped': True, 'requiredFields': True,
                              'exampleContainsTarget': True, 'humanReviewed': False},
            'approxDisclaimer': 'Türkçe yaklaşık okunuş yardımcıdır; IPA ve sesin yerine geçmez. İngilizcedeki bazı seslerin Türkçede tam karşılığı yoktur. İçerik editoryal inceleme bekliyor.',
        }
        if r.get('contentNote'):
            card['contentNote'] = r['contentNote']
        if r.get('acceptedAnswers'):
            card['acceptedAnswers'] = r['acceptedAnswers']
        result[source['word']] = card
    return result


def proofs_external(row, evidence):
    """Describe which externally retrieved values this row actually used."""
    record = next((e for e in evidence if (e.get('id') or e.get('sourceId')) == row['sourceId']), None)
    if not record:
        return None
    used = []
    for accent, suffix in (('en-US', 'US'), ('en-GB', 'UK')):
        if row.get('ipaEvidence' + suffix) == 'external-dictionary':
            value = external_of(record, accent)
            if value:
                used.append(f'{accent} {value.get("sourceUrl")}')
    if row.get('translationEvidence', '').startswith('https://'):
        fetched = ((record.get('externalEvidence') or {}).get('translations') or {})
        if fetched.get('sourceUrl') == row['translationEvidence']:
            used.append(f'translation {fetched["sourceUrl"]}')
    if not used:
        return None
    return {'summary': 'Public dictionary pages retrieved for missing evidence',
            'scope': '; '.join(used)}


def merge_into_active(staged_cards, active_path, staged_path):
    """Atomically replace active enrichment with A1 plus the new levels.

    Refuses to write unless the new levels cover their full source inventory and
    no A1 card is lost or altered.
    """
    active = json.loads(active_path.read_text(encoding='utf-8'))
    before = json.dumps(active, ensure_ascii=False, sort_keys=True)
    merged = dict(active)
    for headword, card in staged_cards.items():
        if headword in merged and merged[headword] != card:
            raise ValueError(f'{headword}: staged card differs from existing active card')
        merged[headword] = card
    after_a1 = json.dumps({k: v for k, v in merged.items() if v.get('sourceLevel') == 'A1'},
                          ensure_ascii=False, sort_keys=True)
    a1_before = json.dumps({k: v for k, v in active.items() if v.get('sourceLevel') == 'A1'},
                           ensure_ascii=False, sort_keys=True)
    if after_a1 != a1_before:
        raise ValueExit('A1 cards changed during merge; nothing written')
    staged_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return len(merged), before


class ValueExit(Exception):
    pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--levels', nargs='+', default=['A2', 'B1', 'B2'])
    parser.add_argument('--evidence', default='content-work/evidence-a2b1b2.json')
    parser.add_argument('--output', default='content-work/enrichment.staged-ab.json')
    parser.add_argument('--report', default='content-work/reviews/staged-report.json')
    args = parser.parse_args()

    sources = json.loads((ROOT / 'data/words.json').read_text(encoding='utf-8'))
    evidence = json.loads((ROOT / args.evidence).read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'content-work/level-report.json').read_text(encoding='utf-8'))
    active_path = ROOT / 'data/enrichment.json'
    active = json.loads(active_path.read_text(encoding='utf-8'))

    # A1 examples are already owned; new cards may not reuse them.
    seen = {c['example'].strip().casefold(): h for h, c in active.items() if c.get('example')}

    rows, missing_files = [], []
    for level in args.levels:
        for entry in manifest['batches'].get(level, []):
            path = ROOT / 'content-work/batches' / f"{entry['file']}.json"
            if not path.exists():
                missing_files.append(str(path))
                continue
            batch = json.loads(path.read_text(encoding='utf-8-sig'))
            if not isinstance(batch, list) or len(batch) != entry['records']:
                raise SystemExit(f'{path}: expected {entry["records"]} records, found '
                                 f'{len(batch) if isinstance(batch, list) else "non-list"}')
            rows.extend(batch)
    if missing_files:
        raise SystemExit('Missing batches; nothing written: ' + ', '.join(missing_files))

    counts = collections.Counter(r.get('sourceId') for r in rows)
    wanted = {s['id'] for s in sources if s['level'] in args.levels}
    if set(counts) != wanted or any(n != 1 for n in counts.values()):
        raise SystemExit(f'Coverage mismatch: have {len(counts)}, need {len(wanted)}; nothing written')

    cards = make_enrichment(rows, sources, evidence, tuple(args.levels), seen)
    output = ROOT / args.output
    if output.resolve() == active_path.resolve():
        raise SystemExit('Stage first; do not overwrite active data with this tool')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(cards, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    by_level = collections.Counter(c['sourceLevel'] for c in cards.values())
    summary = {
        'staged': str(output),
        'rows': len(rows),
        'cards': len(cards),
        'byLevel': dict(sorted(by_level.items())),
        'us': sum('en-US' in c['pronunciations'] for c in cards.values()),
        'uk': sum('en-GB' in c['pronunciations'] for c in cards.values()),
        'reviewed': sum(1 for c in cards.values() if c['reviewStatus'] == 'reviewed'),
        'activeA1Unchanged': True,
    }
    (ROOT / args.report).parent.mkdir(parents=True, exist_ok=True)
    (ROOT / args.report).write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()
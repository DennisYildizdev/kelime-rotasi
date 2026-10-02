"""Audit Oxford PDF by styled lines rather than whitespace columns."""
import re
import hashlib

POS = re.compile(r'\b(indefinite article|definite article|infinitive marker|auxiliary v\.|modal v\.|number|adj\.|adv\.|noun\.|n\.|v\.|prep\.|pron\.|det\.|conj\.|exclam\.)')
LEVEL = re.compile(r'\b(A1|A2|B1|B2)\b')


def records_from_lines(lines):
    groups = []
    for line in lines:
        if line['head']:
            groups.append(dict(line))
        elif groups and (groups[-1]['page'], groups[-1]['column']) == (line['page'], line['column']):
            groups[-1]['text'] += ' ' + line['text']
        else:
            raise ValueError('Orphan continuation: ' + repr(line))
    rows = []
    for item in groups:
        raw = re.sub(r'\s+', ' ', item['text']).strip()
        pos = POS.search(raw, 1)
        levels = list(dict.fromkeys(LEVEL.findall(raw)))
        if not pos or not levels:
            raise ValueError('Unparsed record: ' + raw)
        word = raw[:pos.start()].strip()
        source = {'page': item['page'], 'column': item['column'], 'raw': raw}
        rows.append({'word': word, 'raw': raw, 'partOfSpeech': pos[0], 'level': levels[0], 'levels': levels, 'source': source})
    return rows


def assign_ids(rows, old):
    previous = {(r['word'], r['level']): r for r in old}
    assigned = []
    for record in rows:
        row = dict(record)
        token = row['word'] + '|' + row['level']
        row['stableId'] = 'ox-' + hashlib.sha256(token.encode('utf-8')).hexdigest()[:20]
        existing = previous.get((row['word'], row['level']))
        if not existing and row['word'] == 'o’clock':
            existing = previous.get(("o'clock", row['level']))
            if existing:
                row['migrationNote'] = 'Legacy extractor ASCII apostrophe alias'
        row['id'] = existing['id'] if existing else row['stableId']
        row['legacyIds'] = [existing['id']] if existing else []
        senses = []
        start = POS.search(row['raw'], len(row['word'])).start()
        for match in LEVEL.finditer(row['raw'], start):
            pos_text = row['raw'][start:match.start()].strip(' ,')
            senses.append({'partOfSpeech': pos_text, 'level': match[1]})
            start = match.end()
        row['senses'] = senses
        assigned.append(row)
    if len({r['stableId'] for r in assigned}) != len(assigned):
        raise ValueError('Duplicate stable IDs: examine source homographs')
    return assigned


def extract_pdf(path):
    import pymupdf
    doc = pymupdf.open(path)
    if doc.is_encrypted:
        raise ValueError('Encrypted PDF')
    lines = []
    for page_index, page in enumerate(doc):
        columns = {n: [] for n in range(4)}
        for block in page.get_text('dict')['blocks']:
            if block['type'] != 0:
                continue
            for line in block['lines']:
                x, y = line['bbox'][:2]
                if y >= 800 or (page_index == 0 and y < 110):
                    continue
                text = ''.join(s['text'] for s in line['spans']).replace('\x08', '').replace('\u00a0', ' ')
                if not text.strip():
                    continue
                column = min(3, max(0, round((x - 42.52) / 130.39)))
                first = next(s for s in line['spans'] if s['text'].strip())
                is_head = first['font'] == 'MyriadPro-Regular'
                columns[column].append({'text': text, 'head': is_head, 'page': page_index + 1, 'column': column + 1, 'y': y})
        for column in columns.values():
            lines.extend(sorted(column, key=lambda item: item['y']))
    return records_from_lines(lines)


def build_report(rows, old):
    from collections import Counter
    prior = {row['id']: row for row in old}
    by_id = {row['id']: row for row in rows}
    return {
        'method': 'PDF font-aware headwords + column/vertical ordering + continuation joining',
        'sourceCount': len(rows), 'previousCount': len(old),
        'levels': dict(Counter(row['level'] for row in rows)),
        'pages': dict(Counter(row['source']['page'] for row in rows)),
        'addedWords': [row['word'] for row in rows if row['id'] not in prior],
        'unmappedLegacyIds': sorted(set(prior) - set(by_id)),
        'updatedRaw': [{'word': row['word'], 'before': prior[row['id']]['raw'], 'after': row['raw'], 'page': row['source']['page']} for row in rows if row['id'] in prior and prior[row['id']].get('raw') != row['raw']],
        'legacyToStable': {row['id']: row['stableId'] for row in rows if row['id'] in prior},
        'note': 'id stays backward-compatible; stableId is independent of array order. Source metadata is not a verified dictionary enrichment.'
    }


if __name__ == '__main__':
    import argparse
    import json
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    words_file = root / 'data/words.json'
    old = json.loads(words_file.read_text(encoding='utf-8'))
    rows = assign_ids(extract_pdf(args.pdf), old)
    report = build_report(rows, old)
    report['pdfSha256'] = hashlib.sha256(args.pdf.read_bytes()).hexdigest()
    report['sourceFile'] = args.pdf.name
    if report['unmappedLegacyIds']:
        raise SystemExit('Refusing migration: unmatched existing progress IDs')
    (root / 'data/source-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    target = words_file if args.apply else root / 'data/words-reconciled.json'
    target.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: report[k] for k in ['sourceCount','previousCount','levels','addedWords','unmappedLegacyIds']}, ensure_ascii=True))
    print('Output:', target)

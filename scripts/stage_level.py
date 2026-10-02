"""Stage one complete level for publication from its authored batch files.

Usage:
    python scripts/stage_level.py --level B1

Reads every authored batch for the level from ``content-work/batches`` (the
100-card groups) and ``content-work/mini-batches`` (the 25-card groups), so a
level split across both authoring runs still stages as one unit. Refuses to
write unless the level covers its full source inventory exactly once and every
card passes the staged validator. Writes a headword-keyed file that
``publish_staged_level.py`` can then merge atomically.
"""
from __future__ import annotations

import argparse
import collections
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.level_content import make_enrichment  # noqa: E402

BATCH_DIRS = ('content-work/batches', 'content-work/mini-batches')


def load_rows(level, sources):
    """Every authored row for this level, newest file winning on duplicates."""
    prefix = level.lower()
    wanted = {s['id'] for s in sources if s['level'] == level}
    rows, duplicates = {}, []
    for folder in BATCH_DIRS:
        for path in sorted((ROOT / folder).glob(f'{prefix}-*.json')):
            batch = json.loads(path.read_text(encoding='utf-8-sig'))
            if not isinstance(batch, list):
                raise SystemExit(f'{path}: expected a JSON array of cards')
            for row in batch:
                if row.get('sourceId') not in wanted:
                    continue
                if row['sourceId'] in rows:
                    duplicates.append(f'{path.name}:{row["sourceId"]}')
                rows[row['sourceId']] = row
    if duplicates:
        raise SystemExit('Duplicate source IDs across batches: ' + ', '.join(duplicates[:10]))
    missing = wanted - set(rows)
    extra = set(rows) - wanted
    if missing or extra:
        raise SystemExit(f'{level}: {len(rows)} authored, {len(wanted)} required;'
                         f' missing {len(missing)}, unexpected {len(extra)}; nothing written')
    return [rows[key] for key in sorted(rows)], wanted


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--level', required=True, choices=['A2', 'B1', 'B2'])
    parser.add_argument('--output')
    parser.add_argument('--evidence', default='content-work/evidence-a2b1b2.json')
    args = parser.parse_args()

    sources = json.loads((ROOT / 'data/words.json').read_text(encoding='utf-8'))
    evidence = json.loads((ROOT / args.evidence).read_text(encoding='utf-8'))
    active = json.loads((ROOT / 'data/enrichment.json').read_text(encoding='utf-8'))

    # Examples already published (A1 + previously released levels) are owned.
    seen = {card['example'].strip().casefold(): head
            for head, card in active.items() if card.get('example')}

    rows, wanted = load_rows(args.level, sources)
    cards = make_enrichment(rows, sources, evidence, (args.level,), seen)

    by_level = collections.Counter(card['sourceLevel'] for card in cards.values())
    summary = {
        'level': args.level,
        'rows': len(rows),
        'required': len(wanted),
        'cards': len(cards),
        'byLevel': dict(sorted(by_level.items())),
        'us': sum('en-US' in c['pronunciations'] for c in cards.values()),
        'uk': sum('en-GB' in c['pronunciations'] for c in cards.values()),
        'reviewed': sum(1 for c in cards.values() if c['reviewStatus'] == 'reviewed'),
    }

    output = ROOT / (args.output or f'content-work/enrichment.staged-{args.level.lower()}.json')
    if output.resolve() == (ROOT / 'data/enrichment.json').resolve():
        raise SystemExit('Stage first; never write active data directly')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(cards, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    summary['staged'] = str(output)
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()
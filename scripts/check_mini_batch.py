"""Validate one or more authored mini-batches against the staged level contract.

Usage:
    python scripts/check_mini_batch.py b1-05-p1 [b1-05-p2 ...]
    python scripts/check_mini_batch.py --all

Prints one line per batch plus the exact source IDs whose translationEvidence
is still blank, so a caller can source real dictionary evidence instead of
inventing one. Exits non-zero if any batch fails.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from scripts.level_content import validate_rows  # noqa: E402

MINI = ROOT / 'content-work' / 'mini-batches'
INPUTS = ROOT / 'content-work' / 'mini-inputs'


def seen_examples(current, own_ids=frozenset()):
    """Example strings owned by anything except the batch under test.

    A published batch also lives in ``data/enrichment.json``, so its own
    examples would otherwise look like collisions with itself.
    """
    seen = {}
    sources = [ROOT / 'data' / 'enrichment.json']
    sources += sorted((ROOT / 'content-work' / 'batches').glob('*.json'))
    sources += [p for p in sorted(MINI.glob('*.json')) if p.stem != current]
    for path in sources:
        data = json.loads(path.read_text(encoding='utf-8'))
        rows = data.values() if isinstance(data, dict) else data
        for row in rows:
            if row.get('sourceId') in own_ids:
                continue
            example = (row.get('example') or '').strip().casefold()
            if example:
                seen[example] = row.get('sourceId', '')
    return seen


def check(name):
    rows = json.loads((MINI / f'{name}.json').read_text(encoding='utf-8'))
    source_rows = json.loads((INPUTS / f'{name}.json').read_text(encoding='utf-8'))
    words = json.loads((ROOT / 'data' / 'words.json').read_text(encoding='utf-8'))
    evidence = json.loads(
        (ROOT / 'content-work' / 'evidence-a2b1b2.json').read_text(encoding='utf-8'))
    ids = {row['sourceId'] for row in source_rows}
    scoped = [word for word in words if word['id'] in ids]
    levels = tuple(sorted({row['level'] for row in source_rows}))
    errors = validate_rows(
        rows, scoped, evidence, levels=levels, seen_examples=seen_examples(name, ids))
    gaps = sorted({row['sourceId'] for row in rows
                   if not (row.get('translationEvidence') or '').strip()})
    state = 'PASS' if not errors else f'FAIL({len(errors)})'
    print(f'{name}: {len(rows)} cards {state} gaps={len(gaps)}'
          + (f' -> {",".join(gaps)}' if gaps else ''))
    for error in errors:
        print(f'  {error}')
    return not errors


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    if argv == ['--all']:
        names = sorted(p.stem for p in MINI.glob('*.json'))
    else:
        names = argv
    # Evaluate every batch: `all()` would stop at the first failure and hide
    # the remaining ones.
    results = [check(name) for name in names]
    return 0 if all(results) else 1


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
"""Package the built publish directory as a release ZIP and verify it.

Usage:
    python scripts/package_release.py

Reads only ``dist/`` (the build allowlist), writes ``Kelime-Rotasi-web.zip`` at
the project root, then reopens the archive to prove it is readable, contains
exactly the built files byte-for-byte, and still carries the third-party
notices and licenses required for the embedded dictionary data.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
ARCHIVE = ROOT / 'Kelime-Rotasi-web.zip'

REQUIRED_NOTICES = [
    'LICENSE',
    'THIRD-PARTY-NOTICES.md',
    'licenses/ipa-dict-MIT.txt',
    'licenses/cmudict-ipa-MIT.txt',
    'licenses/ipacards-GPL-3.0.txt',
    'licenses/WikDict-CC-BY-SA-4.0.txt',
]

# Runtime assets only: no tests, authoring batches, notes or dependencies.
FORBIDDEN_PARTS = {'tests', 'scripts', 'content-work', 'node_modules', 'docs'}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def build() -> dict:
    files = sorted(p for p in DIST.rglob('*') if p.is_file())
    if not files:
        raise SystemExit('dist/ is empty; run npm run build first')
    names = [p.relative_to(DIST).as_posix() for p in files]
    for name in names:
        if FORBIDDEN_PARTS & set(name.split('/')):
            raise SystemExit(f'Refusing to package non-runtime file: {name}')
    for notice in REQUIRED_NOTICES:
        if notice not in names:
            raise SystemExit(f'Missing required notice or license in dist/: {notice}')

    ARCHIVE.unlink(missing_ok=True)
    with zipfile.ZipFile(ARCHIVE, 'w', zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            zf.write(path, path.relative_to(DIST).as_posix())
    return {'archive': str(ARCHIVE), 'entries': len(names)}


def verify() -> dict:
    with zipfile.ZipFile(ARCHIVE) as zf:
        bad = zf.testzip()
        if bad:
            raise SystemExit(f'Archive is corrupt at {bad}')
        archived = {info.filename: zf.read(info.filename) for info in zf.infolist()}

    built = {p.relative_to(DIST).as_posix(): p for p in DIST.rglob('*') if p.is_file()}
    if set(archived) != set(built):
        only_zip = sorted(set(archived) - set(built))
        only_dist = sorted(set(built) - set(archived))
        raise SystemExit(f'Archive/dist mismatch; only in zip {only_zip}, only in dist {only_dist}')

    mismatched = [name for name in built
                  if digest(archived[name]) != digest(built[name].read_bytes())]
    if mismatched:
        raise SystemExit('Content differs for: ' + ', '.join(sorted(mismatched)[:10]))

    return {
        'archive': str(ARCHIVE),
        'bytes': ARCHIVE.stat().st_size,
        'entries': len(archived),
        'byteForByte': True,
        'noticesIncluded': [n for n in REQUIRED_NOTICES if n in archived],
    }


def main():
    built = build()
    report = verify()
    print(json.dumps({**built, **report}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
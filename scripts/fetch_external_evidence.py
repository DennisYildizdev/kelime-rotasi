"""Retrieve real dictionary evidence for words the offline snapshots cannot source.

Fetches the Wiktionary page wikitext via the public MediaWiki API for each
word and extracts the American/British IPA transcriptions and the Turkish
translations exactly as printed. Nothing is invented: a word whose page has no
US IPA or no Turkish section is reported as unverified and left empty, and the
caller (scripts/prepare_level_batches.py) records that it needs external data.
"""
from pathlib import Path
import argparse
import json
import re
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
API = 'https://en.wiktionary.org/w/api.php'
UA = 'KelimeRotasi-content-pipeline/1.0 (educational prototype; evidence retrieval)'

# Parenthetical and homograph-number suffixes must not reach the lookup URL.
ALIASES = {
    'according to': 'According_to', 'all right': 'all_right', 'any more': 'any_more',
    'per cent': 'per_cent', 'used to': 'used_to',
}


def page_title(headword):
    if headword in ALIASES:
        return ALIASES[headword]
    return headword.replace(' ', '_')


def fetch(title, retries=4):
    params = urllib.parse.urlencode({
        'action': 'query', 'prop': 'revisions', 'rvprop': 'content', 'rvslots': 'main',
        'format': 'json', 'formatversion': '2', 'titles': title, 'redirects': '1',
    })
    last = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(f'{API}?{params}', headers={'User-Agent': UA})
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode('utf-8'))
            pages = payload.get('query', {}).get('pages', [])
            if not pages or 'revisions' not in pages[0]:
                return None, 'page or revision missing'
            return pages[0]['revisions'][0]['slots']['main']['content'], None
        except Exception as error:  # noqa: BLE001 - network variety is expected
            last = error
            # 429 needs a longer pause than a transient connection error.
            wait = 20 if '429' in str(error) else 3 + attempt * 3
            time.sleep(wait)
    return None, f'{type(last).__name__}: {last}'


def english_section(text):
    """Return the ==English== block only, so other languages cannot leak in."""
    match = re.search(r'^==\s*English\s*==\s*$', text, re.M)
    if not match:
        return ''
    rest = text[match.end():]
    nxt = re.search(r'^==\s*(?!English\b)[^=].*?==\s*$', rest, re.M)
    return rest[: nxt.start()] if nxt else rest


def ipa_after(text, marker):
    """Collect IPA transcriptions that appear after a US/UK marker."""
    if not marker:
        return []
    tail = text[marker:]
    stop = re.search(r'^===', tail, re.M)
    if stop:
        tail = tail[: stop.start()]
    return [m.group(1).strip() for m in re.finditer(r'\{\{IPA\|en\|([^}|]+)', tail)]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--words', default='content-work/problem-words.json')
    parser.add_argument('--output', default='content-work/external-evidence.json')
    parser.add_argument('--delay', type=float, default=2.5)
    args = parser.parse_args()

    wanted = json.loads((ROOT / args.words).read_text(encoding='utf-8'))
    result = {}
    for item in wanted:
        headword, source_id = item['word'], item['id']
        title = page_title(headword)
        text, error = fetch(title)
        record = {'headword': headword, 'sourceUrl': f'https://en.wiktionary.org/wiki/{title}',
                  'note': '', 'unverified': error or ''}
        if text:
            body = english_section(text)
            # Work line by line: the accent label and its IPA may sit on the same
            # line or on the following one.
            lines = body.split('\n')
            us, gb, unaccented = [], [], []
            for index, line in enumerate(lines):
                window = '\n'.join(lines[index:index + 2])
                found = [m.group(1).strip() for m in re.finditer(r'\{\{IPA\|en\|([^}|]+)', window)]
                if not found:
                    continue
                if re.search(r'\{\{a\|US\}\}|\{\{US\}\}', line) or re.search(r'\bUS\b', line):
                    us.extend(found[:1])
                elif re.search(r'\{\{a\|UK\}\}|\{\{UK\}\}', line) or re.search(r'\bUK\b', line):
                    gb.extend(found[:1])
                else:
                    unaccented.extend(found[:1])
            if not us and unaccented:
                # A single-accent entry (very common for British-only spellings):
                # treat it as the page's only transcription and say so.
                us = unaccented[:1]
                record['note'] = ('The page prints one transcription without an explicit '
                                   'accent label; recorded as en-US.')
            if not us and not gb and not unaccented:
                record['note'] = 'No IPA transcription found in the English section.'
            def normalise(value):
                # Wiktionary stores either /x/ or x; keep exactly one slash pair.
                value = value.strip()
                if not value:
                    return None
                inner = value.strip('/').strip()
                return f'/{inner}/' if inner else None

            record['ipa'] = {
                'en-US': {'ipa': normalise(us[0]), 'sourceUrl': record['sourceUrl']} if us else {'ipa': None, 'sourceUrl': None},
                'en-GB': {'ipa': normalise(gb[0]), 'sourceUrl': record['sourceUrl']} if gb else {'ipa': None, 'sourceUrl': None},
            }
            # Turkish glosses live on the English entry as
            #   * Turkish: {{t|tr|term}}, {{t+|tr|term}}
            # not in a separate language section.
            turkish_terms = []
            for match in re.finditer(r'\*\s*Turkish:([^\n]*)', body):
                for term in re.finditer(r'\{\{t\+?\|tr\|([^}|]+)', match.group(1)):
                    word = term.group(1).strip()
                    if word:
                        turkish_terms.append(word)
            turkish_terms = sorted(set(turkish_terms))
            if turkish_terms:
                record['translations'] = {
                    'translations': turkish_terms,
                    'sourceUrl': f'{record["sourceUrl"]}#English',
                }
            else:
                record['translations'] = {'translations': [], 'sourceUrl': None,
                                          'unverified': 'English entry lists no Turkish gloss'}
        result[source_id] = record
        time.sleep(args.delay)

    (ROOT / args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    have_us = sum(1 for r in result.values() if (r.get('ipa', {}).get('en-US') or {}).get('ipa'))
    have_tr = sum(1 for r in result.values() if (r.get('translations') or {}).get('translations'))
    print(json.dumps({'words': len(result), 'withUS': have_us, 'withTurkish': have_tr,
                      'output': args.output}, ensure_ascii=False))


if __name__ == '__main__':
    main()
# Third-party vocabulary data notices

## Source word inventory

`data/words.json` was extracted from the user-supplied **The Oxford 3000** PDF. Source IDs, page locations, raw text and level/part-of-speech mappings are retained. No Oxford affiliation, endorsement or permission for public redistribution is asserted. The source PDF itself is not in the web distribution.

## A1 expansion reference sources

These notices accompany the expansion content when entries carry `contentRelease: a1-expanded-1`. Each card records its source evidence and modifications in `provenance`. A complete field is not a claim of human editorial review; cards remain `draft`.

### American pronunciation

- Source: **ipa-dict**, https://github.com/open-dict-data/ipa-dict, `data/en_US.txt`.
- ipa-dict copyright (c) 2016 **dohliam**; MIT license in `licenses/ipa-dict-MIT.txt`.
- US dataset is based on **cmudict-ipa**, https://github.com/lingz/cmudict-ipa, copyright (c) 2016 **Lingliang Zhang**; MIT license in `licenses/cmudict-ipa-MIT.txt`.
- Adaptations: A1 subset, lookup aliases for annotated source headwords, selection of a pronunciation variant for the taught part of speech/sense, pairing with original examples and Turkish approximation aids. Where a different dictionary is used, the individual entry records its URL instead.

### Optional British pronunciation

- Source: ipa-dict `data/en_UK.txt`, derived from **ipacards** by **leoboiko**, https://github.com/leoboiko/ipacards.
- Third-party UK dataset retains **GNU GPL version 3**; full text in `licenses/ipacards-GPL-3.0.txt`.
- The selected UK transcription data is supplied in editable JSON form in `data/enrichment.json`, with per-entry origin. Adaptations are subsetting, variant selection and association with the source ID. Original reference URLs are retained.
- `legacy-pilot` identifies prior, independently authored draft transcriptions, not sourced ipacards content. Missing UK data is omitted, not synthesized from American spelling/pronunciation.

### Turkish meaning reference

- **WikDict**, https://www.wikdict.com/, English–Turkish dictionary, SQLite snapshot `https://download.wikdict.com/dictionaries/sqlite/2_2026-06/en-tr.sqlite3`.
- Data originates from **Wiktionary contributors**, extracted by **DBnary**, processed by WikDict. Project explanation: https://www.wikdict.com/page/about . Individual English entries and contributor history can be found at `https://en.wiktionary.org/wiki/<word>` and that page's History tab.
- WikDict identifies its data license as **Creative Commons Attribution–ShareAlike 4.0 International**. Full license: `licenses/WikDict-CC-BY-SA-4.0.txt`; canonical license URL: https://creativecommons.org/licenses/by-sa/4.0/ . The bundled text was retrieved from SPDX's license-list-data mirror when the canonical text endpoint refused automated retrieval.
- Adaptations: selecting an A1-appropriate part of speech and sense; concise modern Turkish rendering; filtering unrelated senses. These adapted dictionary portions retain their source license. An entry's `translationEvidence` is preserved in its provenance note.

## Original additions and limits

English example sentences, Turkish example translations, Turkish approximate reading aids and topic tags are AI-assisted authored additions, not copied dictionary example corpora. They are clearly separated from source-derived IPA and dictionary reference provenance. Approximate readings do not reproduce all English sounds and do not substitute for IPA or audio. A qualified human review is still outstanding.

These notices preserve third-party attribution and do not assign a new license to the user's pre-existing application code or to the Oxford inventory. Public publication remains a separate step; no external deployment is performed by creating this package.

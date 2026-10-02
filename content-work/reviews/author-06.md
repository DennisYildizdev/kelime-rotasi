# Author 06 review

## Scope and status

- Authored all 100 records from `content-work/inputs/batch-06.json` into `content-work/batches/batch-06.json`.
- Content is an AI-assisted editorial draft and is **not human-reviewed**.
- Each record was checked individually for the intended A1 part of speech and sense, concise Turkish meaning, exact-headword example use, faithful Turkish example translation, IPA choice, and Turkish approximate reading.

## Validation results

- Records: 100
- Unique source IDs: 100
- Input IDs completed: 100/100, in input order
- Exact source headwords preserved: 100/100
- `scripts/a1_content.py::validate_rows` errors: 0
- Additional checks for exact target occurrence, allowed topic tags, A1 POS alignment, evidence membership/URL form, punctuation, 4–10-word examples, and complete IPA/approximation pairs: 0 errors
- Example length range: 4–8 words
- en-US IPA: 100/100 total; 98 supplied `ipa-dict` candidates and 2 retrieved dictionary pronunciations
- en-GB IPA: 90/100 total; 89 supplied `ipa-dict` candidates and 1 retrieved dictionary pronunciation; unavailable UK entries were left empty
- Translation evidence: 90 supplied WikDict lexentries and 10 retrieved dictionary pages

## Evidence exceptions inspected

- `next-to-1740`: input had no dictionary or IPA candidates; Oxford Learner’s Dictionaries supports the adjacent-to meaning and selected US pronunciation: `https://www.oxfordlearnersdictionaries.com/us/definition/english/next-to`.
- `no-one-1772`: input had no IPA candidates; Cambridge supports the selected US and UK pronunciations: `https://dictionary.cambridge.org/us/dictionary/english/no-one`.
- `nobody-1776`: supplied WikDict entry was labelled as a noun although the A1 source is a pronoun; meaning cross-checked at `https://www.oxfordlearnersdictionaries.com/us/definition/english/nobody`.
- `off-1661`: supplied Turkish candidates did not express the selected non-operating A1 use; meaning cross-checked at `https://dictionary.cambridge.org/us/dictionary/english/off`.
- `out-1864`: supplied WikDict candidate covered an interjection, not the selected A1 adverb; meaning cross-checked at `https://dictionary.cambridge.org/us/dictionary/english/out`.
- `outside-1888`: supplied WikDict candidate covered an adjective, not the selected A1 adverb; meaning cross-checked at `https://dictionary.cambridge.org/us/dictionary/english/outside`.
- `own-1914`: supplied WikDict candidate covered the verb, not the selected A1 adjective; meaning cross-checked at `https://dictionary.cambridge.org/us/dictionary/english/own`.
- `painting-1674`: supplied WikDict lexentry was labelled as a verb despite noun translations; noun meaning cross-checked at `https://dictionary.cambridge.org/us/dictionary/english/painting`.
- `period-1865`: supplied candidates did not clearly cover the general length-of-time sense; meaning cross-checked at `https://dictionary.cambridge.org/us/dictionary/english/period`.
- `phone-1923`: supplied WikDict candidate covered only the verb; noun meaning cross-checked at `https://dictionary.cambridge.org/us/dictionary/english/phone`.
- `photo-1925`: supplied WikDict candidate covered only the verb; noun meaning cross-checked at `https://dictionary.cambridge.org/us/dictionary/english/photo`.

## Unresolved items

- None found in structural or evidence validation.
- All linguistic content remains draft pending independent human editorial review.

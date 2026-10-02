# Batch 03 author review

Date: 2026-10-01
Status: AI-assisted editorial draft; not human-reviewed.

## Coverage and validation

- Authored exactly 100 records for all 100 IDs in `content-work/inputs/batch-03.json`.
- Preserved input order, exact `sourceId`, and exact source `headword` for every record.
- Reread all 100 records for intended A1 sense/POS, concise Turkish meaning, English-example sense alignment, faithful Turkish translation, selected IPA variant, and individually written Turkish approximation.
- Ran `scripts/a1_content.py` `validate_rows` logic against the matching `data/words.json` source rows and the batch input evidence: 0 errors.
- Additional checks passed: 100 unique IDs, 100 unique examples, exact target occurrence in every example, 100 complete US IPA/approximation pairs, valid topic tags, no placeholders, and evidence-field consistency.
- UK evidence was available and used for 91 records. UK fields were left empty and marked `unavailable` for `do1-688`, `downstairs-750`, `dvd-844`, `email-1020`, `evening-977`, `february-1074`, `fine-907`, `finish-915`, and `flower-1007`.

## Evidence exceptions inspected

The supplied WikDict candidate did not support the intended A1 POS/sense for these records, so a retrieved Oxford Learner's Dictionaries entry is recorded in `translationEvidence`, with a record-specific `contentNote`:

- `doctor-692`: medical doctor, not doctorate holder.
- `down-742`: lower-direction adverb, not feather noun.
- `else-1012`: basic “başka” use.
- `event-981`: planned public or social occasion (“etkinlik”), not only general occurrence.
- `exam-1033`: the supplied Turkish candidate had no lexentry identifier.
- `extra-914`: additional adjective, not newspaper-edition noun.
- `film-879`: moving-picture film, not photographic film.
- `fine-907`: well/healthy adjective, not monetary-penalty noun.
- `flat-975`: apartment noun, not level-surface adjective.

## Remaining limitations

- All meanings, examples, translations, sense selections, and Turkish reading aids remain draft content awaiting independent linguistic/editorial review.
- Turkish approximate readings are learning aids only; they are not phonetic authority and intentionally do not replace IPA or audio.
- No unresolved structural or evidence-validation errors remain in this owned batch.

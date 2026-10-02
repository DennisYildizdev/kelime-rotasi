# Author review: batches 08–09

Status: AI-assisted authoring draft; not human-reviewed.

## Scope completed

- `batch-08.json`: retained the existing first 50 records unchanged and added the 50 missing input IDs, for 100 total.
- `batch-09.json`: authored all 100 input IDs.
- Content follows the A1 part of speech and a single selected sense per card.

## Checks performed

- Parsed both input files in full and compared exact ID sets.
- Confirmed 100 records per output, exact input coverage, and no duplicate `sourceId` values.
- Confirmed the original 50 `batch-08.json` objects remain field-for-field unchanged after JSON parsing.
- Checked every required field, exact input `headword`, matching `displayWord`/`speechText`, and non-empty learning text.
- Checked that every English example contains the exact display word as a standalone word or phrase, case-insensitively.
- Checked each selected US IPA against the supplied en-US candidates. UK IPA was included only when supplied; missing UK candidates use empty `ipaUK`/`approxUK` and `unavailable` evidence.
- Individually authored and inspected all new Turkish approximate readings; they remain non-authoritative learning aids.
- Checked topic tags against the allowed list and kept 1–3 tags per card.
- Checked `translationEvidence`: supplied lexentry IDs are present in the corresponding input candidate list; retrieved external dictionary pages are used where candidates were absent or clearly mismatched.
- Checked for empty fields, placeholder text, overlong examples, and meaning/example/evidence mismatches.

## Evidence exceptions documented in cards

- `the`: no suitable article lexentry in the input; external dictionary evidence and a Turkish article note were added.
- `theatre`, `trousers`: input translations had no lexentry IDs; external dictionary evidence was added.
- `topic`: the supplied Turkish options were less suitable for a modern A1 card; external dictionary evidence supports the selected `konu`.
- `will`, `would`: input candidates did not support the intended A1 modal meanings; external dictionary evidence and notes were added.
- `work`: the input verb gloss was attached to a noun lexentry ID; external verb evidence and a note were added.
- `use`: the verb pronunciation `/ˈjuz/` was selected rather than the noun pronunciation `/ˈjus/`.

## Remaining review status

No structural or coverage issues remain. Linguistic/editorial human review is still pending, especially for Turkish approximate pronunciation aids and function-word teaching notes.

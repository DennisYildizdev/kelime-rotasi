# a2-05 — authoring review

Batch: `content-work/batches/a2-05.json`
Input: `content-work/inputs/a2-05.json`
Contract: `content-work/AUTHORING-AB.md` (+ `AUTHORING.md` for A1 context)
Status: **draft**. Authored with AI assistance and checked only by the
automated scripts listed below. No editorial or human review has happened.

## Record count / identity

- File is a JSON **array** with exactly **100** records (re-read from disk after
  the last edit, not from the in-memory authoring buffer).
- `sourceId` list compared against the input as an ordered list: **exact match,
  same 100 IDs in the same order**.
- `headword` compared per record against the input: **100/100 identical**,
  including the two parenthetical homographs which were preserved verbatim
  (`light (not heavy)`, `mine (belongs to me)`).
- `displayWord` matches the input `displayWordHint` for all 100 records;
  `speechText == displayWord` for all 100.

## Checks actually run (Python, exit code 0)

Script: `C:\Users\PC\AppData\Local\hermes\cache\scratch\a205_final.py` (re-reads
the written batch file) plus `a205_validate.py` (stricter pre-write gate).

| Check | Result |
|---|---|
| All 13 mandatory fields present on every record | pass (0 missing) |
| `ipaUS` is a verbatim member of that record's own `ipaCandidates["en-US"]`, slash-delimited into variants first | 99/99 non-empty pass; the one empty record is `maths-1495` |
| `ipaUK` is a verbatim member of `ipaCandidates["en-GB"]` | 95/95 non-empty pass; 5 records have no en-GB candidate and were left empty |
| `ipaEvidenceUS` == `ipa-dict/en_US:<translationLookup>` | 100/100 (verified for the 99 with a real candidate; `maths` left empty) |
| `ipaEvidenceUK` == `ipa-dict/en_GB:<lemma>` when a candidate exists, else `"unavailable"` | 100/100 |
| `example` contains `displayWord` with word boundaries (`(?<![A-Za-z0-9'])` … `(?![A-Za-z0-9'])`, case-insensitive) | 100/100 |
| Example uniqueness inside the batch | 100 unique / 100 |
| Example collision against the 900 A1 examples in `data/enrichment.json` | 0 collisions |
| Example collision against all 9 existing A1 batch files in `content-work/batches/` | 0 collisions |
| Example word count 4–10 | min 6, max 10 |
| Example starts uppercase and ends with terminal punctuation | 100/100 |
| `exampleTr` non-empty | 100/100 |
| `topicTags` count 1–3 and drawn only from the allowed 24-tag list | 100/100 |
| `translationEvidence` is an `entry` string that exists in that record's `dictionaryCandidates` | pass for every record where `translation` is filled; the single empty-translation record also has empty evidence |
| No `contentNote` claims human review (scanned for "insan taraf", "human review", "human-reviewed") | pass |
| No IPA glyphs leaked into `approxUS` / `approxUK` | pass (see fixes below) |

## Problems found during the work and what I did

1. **`ipaUK` invented by me (95 records).** My first pass hand-wrote the UK
   IPA. Validation showed most of them were *not* in the input candidate list
   (I had written `/lˈɛktʃə/` where the input has `/lˈɛktʃɐ/`, `/mˈæɹi/` vs
   `/mˈæɹi/`, etc.). **Fix:** snapped all 95 `ipaUK` values to the exact input
   en-GB candidate string. No UK IPA is now authored from memory.
2. **Two examples failed the word-boundary test** because they only contained
   an inflected form: `manage` ("She *manages* a small team…") and `option`
   ("two *options*"). **Fix:** rewritten to carry the bare base form
   ("She can **manage** a small team of five people." / "Please choose one
   **option** from the list below.").
3. **`approxUS` schwa errors.** 19 records mapped /ə/ to rounded Turkish
   `ö`/`ü` (`lovely` "luv-li", `oven` "ö-vön", `novel` "no-völ", `nervous`
   "nör-vös", `mobile` "mö-böl", …). Schwa is unrounded, so these were wrong.
   **Fix:** all 19 rewritten with neutral `e`; `contentNote` extended on
   `metal`, `middle`, `novel`, `oven` to explain the dark /l/.
4. **IPA glyphs leaking into approx fields.** `nowhere` approxUS contained
   `ɛ` ("no-vɛr"); `learning` approxUK contained `ŋ`; `neither` approxUK
   contained `ð`. **Fix:** "no-ve-ör", "lör-ning", "nay-de".
5. **My own validator had a typo** (`ipa-dict/en_UK:` instead of `en_GB:`)
   which produced ~95 false positives on the first run. Fixed the validator;
   the underlying card data was already correct.
6. **`least` example reworked** after read-through: the original ("We chose the
   least busy hour…") taught a sense weaker than the translation "en az".
   Now "She has the least experience of the whole team."
7. **`mobile` translation reworked** after read-through: "taşınabilir" did not
   match an example about a mobile phone. Now "mobil".

## Evidence mismatches documented in `contentNote` (not silently "fixed")

These are cases where the input's `dictionaryCandidates` do not match the
source POS. The contract allows correcting an obvious mismatch as long as it is
documented; I kept the real lexentry as evidence and wrote the Turkish
independently:

- `mark-1440` — POS is verb, all candidates are noun senses. Taught "not vermek";
  evidence `eng/mark__Noun__1`; mismatch noted.
- `might-1631` — POS is modal verb, all candidates are noun ("güç/kuvvet").
  Taught "belki"; evidence `eng/might__Noun__1`; mismatch noted.
- `pass-1758` — the "geçmek" translation row arrived with `entry: null`, so the
  recorded lexentry `eng/pass__Verb__1` is used and the substitution is noted.
- `organize-1817` — the "düzenlemek" row also has `entry: null`; same handling.
- `lovely-1606` — dictionary gives only "ala" (score 1); taught "çok güzel".
- `major-1391` — dictionary says "ergin"; used the more natural A2 "reşit"
  (US sense "of full legal age"). The military-noun sense was not taught.
- `manage-1415` — Turkish candidates ("varmak", "çıkmak", "bilmek") do not match
  any English sense; chose "yönetmek" from the English gloss.
- `matter-1499` — the "issue" sense is mistranslated "madde"; used "mesele".
- `parking-1718` — only candidate is "durguluk" (score 0); used "otopark".
- `mobile-1719`, `musical-1862`, `particular-1738`, `original-1833`,
  `ourselves-1860` — candidate translations unusable or noun-sense-only;
  noted individually.

## Unresolved items for the parent

1. **`maths-1495` has no IPA at all.** Input `needsExternal:
   ["no-en-US-IPA-candidate"]`, `ipaCandidates` empty for both locales.
   `ipaUS`, `approxUS`, `ipaEvidenceUS` left **empty** (not invented).
   Parent must supply external evidence. Note `mathematics-1491` in the same
   batch does have `/ˌmæθəˈmætɪks/`, but I did not copy it across — that would
   be manufacturing a source claim.
2. **`lorry-1574` has no translation.** Input `needsExternal:
   ["no-translation-candidate"]`, `dictionaryCandidates` empty.
   `translation` and `translationEvidence` left **empty**. The example sentence
   and `exampleTr` use "kamyon", which is flagged in `contentNote` as a
   provisional rendering, not a dictionary-backed choice. Parent should add the
   real evidence.
3. **5 records have no en-GB candidate** (`maths`, `mobile`, `none`,
   `organization`, `organize`). `ipaUK`/`approxUK` left empty and
   `ipaEvidenceUK: "unavailable"` — deliberately **not** copied from en-US, per
   the contract.
4. **`approxUS`/`approxUK` are hand-written approximations only.** They are not
   phonetic authority and no pronunciation scoring has been done against them.
5. **Turkish translations are my own judgement calls**, not dictionary output.
   Several deliberately prefer the modern/natural Turkish term over the
   dictionary string (`organization` → "kuruluş", `major` → "reşit"). A native
   reviewer may want to change these.
6. **Not checked:** no listening test, no speaker recording, no editorial
   review, no level re-confirmation against the Oxford source pages beyond
   trusting the input `pos` field.

## Summary

- Path written: `C:\Users\PC\Oxford-Focus\content-work\batches\a2-05.json`
- Real record count: **100** (verified from disk)
- Automated checks: **0 failures** on the final file
- Unresolved: 2 records with deliberately empty required fields (`maths`
  IPA, `lorry` translation) awaiting external evidence; 5 records with no UK
  IPA available; all content is draft and not editorially reviewed.

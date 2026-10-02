# a2-04 authoring review

Batch: `content-work/inputs/a2-04.json` → `content-work/batches/a2-04.json`
Scope: 100 A2 cards authored from scratch per `content-work/AUTHORING-AB.md`.
Status: **draft, AI-authored. Not editorially reviewed, not human-verified, no
native-speaker or pronunciation scoring involved.**

## Files written

- `content-work/batches/a2-04.json` — 100 records, 76,327 bytes
- `content-work/reviews/a2-04-review.md` — this file
- (scratch only, outside the repo: `a2_04_partA.py`, `a2_04_partB.py`,
  `build_a2_04.py`, `verify_a2_04.py`, `fix_uk_approx.py`)

No other batch, `data/`, `src/`, `tests/` or `scripts/` file was touched.

## Checks actually run (Python, on the written file re-read from disk)

| Check | Result |
|---|---|
| record count == 100, top level is a JSON array | pass (100) |
| `sourceId` list identical to input **and in input order** | pass |
| `sourceId` set identical, no duplicates in output | pass |
| `headword` byte-identical to input (incl. `last1 (taking time)`, `lead1`) | pass, 0 mismatches |
| `speechText == displayWord` | pass, 0 mismatches |
| every non-empty `ipaUS`, slashes stripped, is an **exact** member of that record's own `ipaCandidates["en-US"]` (comma variants split) | pass, 0 violations (99 checked) |
| every non-empty `ipaUK`, slashes stripped, is an exact member of that record's own `en-GB` candidate list | pass, 0 violations (96 checked) |
| `ipaUK` empty ⇒ input has no en-GB candidate at all (no US→UK copying) | pass: `increase-1275`, `inside-1384`, `invite-1528`, `lead1-1569` |
| `example` contains `displayWord` on a **word boundary** (not a substring) | pass, 0 violations (100) |
| example length 4–10 words | pass, actual range 5–9 |
| no duplicate example inside the batch | pass (100 unique) |
| no duplicate example against other batches | pass — 0 collisions against 1000 examples in `batch-01..09` + `a2-02.json` (a sibling A2 batch was written concurrently, so the pool grew from 900 to 1000 during this task) |
| no duplicate `exampleTr` inside the batch | pass |
| all 13 required fields present on every record | pass |
| `topicTags` 1–3 items, all from the allowed list | pass |
| `ipaEvidenceUS == ipa-dict/en_US:<translationLookup>` whenever `ipaUS` is present | pass |
| every non-empty `translationEvidence` is a real `lexentry` in `content-work/references/en-tr.sqlite3` | pass (97 checked) |
| empty fields only where `needsExternal` is non-empty **or** the input itself offers no usable lexentry, and `contentNote` explains it | pass |
| no `contentNote` claims human review | pass (keyword scan) |

## Problems found by these checks and fixed

1. `immediately-1183`: I had typed `ipaUS = /ˌɪnˈmiˌdiətɫi/`; the real en-US
   candidate is `/ˌɪˈmiˌdiətɫi/` (second symbol is `ɪ`, not `ɪn`). Corrected.
2. Builder bug (not a content bug): the "duplicate with other batches" scan
   initially included `a2-04.json` itself and reported 100 false collisions
   after the first successful write. Excluded self, re-ran: 0 collisions.
3. Manual read-through caught `inside-1384`: the example used the *adverb* sense
   ("stayed inside") while the card teaches the preposition sense ("içinde").
   Example changed to "We stayed inside the house because of the storm."
4. `approxUK` pass: 42 GB renderings mis-read long/rhotic GB vowels
   (`/ɑː/, /ɔː/, /ɜː/, /əʊ/`, non-rhotic endings) and were corrected
   (e.g. `lawyer` "loı-ı" → "loya", `heart` "haat" → "hat",
   `knowledge` "nol-ıç" → "no-luç", `joke` "couk" → "cok").
5. `injury-1371` and `frog-1192` notes reworded after proof-reading the notes
   themselves (one was wrong about the initial sound).

## Unresolved / left for the parent

Six required fields are intentionally empty. They are **not** guesses.

| Record | Empty field(s) | Why | Status |
|---|---|---|---|
| `jewellery-1592` | `ipaUS`, `approxUS` | `needsExternal: ["no-en-US-IPA-candidate"]`; input has no en-US string at all. `ipaEvidenceUS: "unavailable"`. en-GB candidate was used instead. | parent must supply external US evidence |
| `lab-1464` | `translation`, `translationEvidence` | `needsExternal: ["no-translation-candidate"]`; the input carries **no** `dictionaryCandidates` and `en-tr.sqlite3` has zero rows for "lab" (queried directly). Card is otherwise complete. | parent must supply external translation evidence |
| `identify-1127` | `translationEvidence` | Input candidate has `entry: null` (only the bare gloss "özdeşlemek"). SQLite has no `identify` lexentry either. `needsExternal` is **empty**, so this gap is not flagged upstream. | needs external evidence; flagged here for the first time |
| `lead1-1569` | `translationEvidence` | Source POS is verb ("lead" = yönlendirmek) but every input candidate is the noun sense (`eng/lead__Noun__1` = kurşun). Using it would falsely evidence the verb gloss, so it was left empty. `needsExternal` is **empty**. | needs external evidence; flagged here for the first time |

Note: `web_extract` was unavailable in this session (backend is search-only), so
no real dictionary URL could be retrieved as substitute evidence. No URL is
claimed anywhere in the batch.

## Sense / evidence judgement calls (all documented in each `contentNote`)

- `happily-1305`: input gloss is "başarılı" — wrong (that is "successfully").
  Taught "mutlulukla" against the real `in a happy manner` sense.
- `hero-1162`: the only available lexentry is `eng/hero__Verb__1`, but the sense
  ("person of great bravery") is a noun. Kept the real entry string + note.
- `injury-1371`: gloss "zarar" → taught "yaralanma" (A2-usable).
- `item-1560`: the only input candidate is the video-game sense; taught the
  list/catalogue sense "madde" (same lexentry string).
- `involve-1532`: gloss "karıştırmak" → taught "içermek".
- `inside-1384`: source POS `prep.`, evidence taken from the real
  `eng/inside__Adverb__1` record; noted in `contentNote`.
- `last1 (taking time)`: taught the verb "sürmek" with `/ˈɫæst/`, **not**
  `/ˈɫæs/` (that variant belongs to the adjective "son").
- `lead1`: taught the verb with `/ˈɫɛd/`, not the noun `/ˈliːd/`.
- `goal-1117`: taught "amaç", not the football "gol" (same spelling).
- `kid-1413`: taught "çocuk" (colloquial), not the literal "oğlak".

## Not verified

- Approximations (`approxUS`/`approxUK`) are hand-written reading aids for a
  Turkish-speaking learner. They were written one word at a time, but nobody has
  read them aloud or tested them with a speaker.
- No TTS recording was generated and no pronunciation score exists.
- Turkish translations and example sentences were written by the model and
  checked only for internal consistency (sense ↔ example ↔ translation), not by
  a native speaker.
- A sibling A2 batch (`a2-02.json`) appeared while this batch was being
  written; the cross-batch duplicate check was re-run against 1000 examples and
  passed, but any *other* batch written later still needs the same check.

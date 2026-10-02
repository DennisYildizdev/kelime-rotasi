# a2-02 review (author: subagent)

Batch file: `content-work/batches/a2-02.json`
Input: `content-work/inputs/a2-02.json`
Contract: `content-work/AUTHORING-AB.md` (+ `AUTHORING.md` for context)

Status: **draft / AI-assisted**. Not editorially reviewed, not human-reviewed, no
native-speaker recording, no pronunciation scoring.

## Checks actually run (all via Python, on the file read back from disk)

| # | Check | Result |
|---|-------|--------|
| 1 | File is a JSON **array** with exactly 100 records | PASS (100) |
| 2 | `sourceId` list identical to input, same order, same values | PASS |
| 3 | `headword` identical to input for every record (no renaming, no dropping of the `can2` / `close2` homograph markers) | PASS |
| 4 | `displayWord` / `speechText` equal each other; `can2` -> `can`, `close2` -> `close`; no multi-word headwords in this batch | PASS |
| 5 | All 13 mandatory fields present and non-empty on every record | PASS |
| 6 | Every `ipaUS` is **one** `/.../` variant taken verbatim from that record's own `ipaCandidates["en-US"]` (comma-split, exact string match) | PASS (100/100) |
| 7 | Every `ipaUK` is a verbatim member of that record's `ipaCandidates["en-GB"]`; records with an empty en-GB list keep `ipaUK`/`approxUK` = `""` and `ipaEvidenceUK` = `unavailable` | PASS (96 UK filled, 4 intentionally empty) |
| 8 | Every `example` contains `displayWord` with **word boundaries** (regex `(?<![A-Za-z0-9])word(?![A-Za-z0-9])`, case-insensitive) | PASS (100/100) |
| 9 | Example sentences unique **inside** the batch | PASS (0 duplicates) |
| 10 | Example sentences unique against the 900 A1 examples in `content-work/batches/batch-01..09.json` | PASS (0 overlap) |
| 11 | Example length 4–10 words | PASS (min 5, max 9) |
| 12 | Every `topicTags` value is in the allowed vocabulary, 1–3 tags per card | PASS |
| 13 | Every `translationEvidence` string exists as an `entry` in that record's own `dictionaryCandidates` | PASS (100/100) |
| 14 | `ipaEvidenceUS` == `ipa-dict/en_US:<translationLookup>` for all records | PASS |
| 15 | Manual re-read of all 100 records for sense/POS/example/Turkish consistency | done; issues found and fixed (see below) |

## Errors found during the checks and how they were fixed

* **8 examples failed the word-boundary rule** (`collects`, `columns`, `complained`,
  `considering`, `contains`, `continued`, `covered`, `cried` do not contain the bare
  display word). All 8 were rewritten to use the base form:
  `collect` -> "We collect stamps from many countries.", `column` -> "The last column in
  this table is empty.", `complain` -> "Guests often complain about the noisy street.",
  `consider` -> "We must consider a new flat.", `contain` -> "Soft drinks contain a lot
  of sugar.", `continue` -> "The rain will continue until the evening.",
  `cover` -> "Please cover the table with a cloth.",
  `cry` -> "Children cry when they are very tired."
* **1 wrong en-GB IPA copied by hand**: `definitely` was written `/dˈefɪnətli/` (e) but the
  real candidate is `/dˈɛfɪnətli/` (ɛ). Corrected to the exact candidate string.
* **IPA schwa character leaked into Turkish reading aids**: 36 `approxUS`/`approxUK` values
  contained the IPA symbol `ə`. The A1 house style spells schwa with Turkish letters
  (`ı` or `e` per word). All were rewritten by hand (`kəmyunəkeyt` -> `kımyunıkeyt`,
  `kerfol` -> `kerfıl`, `kəntrool` -> `kıntrool`, etc.). Re-checked: zero `ə` left.
* **18 translations were synonym dumps** (`"durum; hâl"`, `"net; açık"`, …). Reduced to one
  modern Turkish word each, and `selectedSense` re-checked against the dictionary gloss.
* **Awkward Turkish sentences** corrected: `coast` ("Kıyı boyunca üç saat boyunca geldik."
  had a duplicated *boyunca*), `connected` ("Köy şehre bağlantılı." -> "Köy artık şehre bağlı."),
  `cross` ("Sokaktan köşede geçin." -> "Köşeden karşıya geçin."),
  `cover` ("...örtün." -> "...kaplayın.").

## Sense / evidence decisions worth flagging to the parent

* `can2-466` → taught as **container** ("teneke kutu"), `ipaUS /ˈkæn/`. The `/kən/` variant in
  the input belongs to the verb "to be able to" and was deliberately not used.
* `close2-308` → taught as the **adjective** ("yakın"), `/ˈkɫoʊs/` (unvoiced s) chosen over
  the `/ˈkɫoʊz/` variant, which belongs to the verb "to close".
* `credit-614` → "privilege of delayed payment" (kredi), `/ˈkɹɛdɪt/` chosen over `/ˈkɹɛdət/`.
* `deal-800` → source POS is **verb** and the only verb sense the WikDict snapshot offers is
  "to distribute (cards)". The card teaches "kart dağıtmak" with that exact evidence. This is
  the weakest card in the batch: A2 learners normally meet *deal* as a noun ("anlaşma") or in
  the phrasal verb *deal with*. The choice is documented in that card's `contentNote`.
* `depend-679` → the only dictionary candidate in the snapshot is "hang down / asmak". The card
  teaches the ordinary A2 sense "bağlı olmak (depend on)"; the mismatch with the retrieved
  gloss is stated in `contentNote`, while `translationEvidence` still points at the real lexentry
  `eng/depend__Verb__1`.
* `connected-613` → the two dictionary candidates are graph-theory/topology definitions
  ("birbiri ile irtibatlı"). The everyday sense ("linked, bağlı") is taught; noted in `contentNote`.
* `correctly-787` → the dictionary gloss for the Turkish string is "iyi", which does not fit an
  adverb of manner; "doğru olarak" was used and the substitution is documented.
* `clearly-276`, `complain-508`, `connect-609`, `consider-633`, `contain-677` → the input's first
  dictionary candidate for these had `entry: null`, so the evidence was taken from the first
  candidate that does have a real lexentry string (e.g. `eng/clearly__Adverb__1`). All five are
  noted in their `contentNote`.
* `degree-619` → the example had to contain the singular "degree" (the plural would break the
  word-boundary rule), so "The temperature rose by one degree." was used instead of the more
  common "...thirty degrees".
* `cycle-740` → taught as "çevrim" (dictionary: "devir | çevirim"). The far more frequent A2
  sense "bisiklet" has no candidate in the input, so it was not invented.

## Unresolved / open items

1. **Four cards have no UK pronunciation** because the input carries an empty `en-GB`
   candidate: `carpet-259`, `close2-308`, `collect-384`, `desert-703`. Their `ipaUK`,
   `approxUK` are `""` and `ipaEvidenceUK` is `"unavailable"`. External evidence is still needed
   if the product wants UK audio for these.
2. **`deal-800` is pedagogically weak** (see above). If the parent prefers the noun sense
   ("anlaşma"), the headword POS in the source is `v.` and the card would need to be swapped.
3. **`depend-679` translation is not backed by a matching dictionary gloss** — only by the
   lexentry string. A parent-side check against a second dictionary would be worth it.
4. **No cross-batch duplicate check against the other A2/B1/B2 batches was possible**: only the
   900 A1 cards exist in `content-work/batches/`. `a2-01.json` … `b2-07.json` inputs exist but
   their authored batches have not been written yet, so example collisions with those batches
   cannot be ruled out from here. The parent merge should re-run that check.
5. Turkish approximations are hand-written reading aids in the A1 house style; they are
   approximations, not phonetic authority, and have not been reviewed by a native speaker.

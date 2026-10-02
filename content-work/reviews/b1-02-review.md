# b1-02 review — authored B1 cards

Batch file: `content-work/batches/b1-02.json`
Input: `content-work/inputs/b1-02.json`
Records: **100** (verified from disk after writing, not from the in-memory list)

Status: **draft / AI-assisted**. Nothing here is editorially reviewed, no human
listened to audio, no pronunciation score exists. The "Türkçe yaklaşık okunuş"
values are hand-written reading aids, not phonetic authority.

## Checks actually run (Python, on the written file)

All of the following were executed; results are the observed output, not intent.

| # | Check | Result |
|---|-------|--------|
| 1 | File parses as a JSON **array** | pass |
| 2 | Record count == 100 | pass (100) |
| 3 | `sourceId` set and **order** identical to input | pass |
| 4 | No duplicate `sourceId` | pass |
| 5 | `headword` byte-identical to input for all 100 | pass |
| 6 | `speechText` == `displayWord` | pass (100/100) |
| 7 | All 13 required fields present and non-blank | pass |
| 8 | `topicTags` 1–3, all from the allowed 24-item list | pass |
| 9 | `ipaUS` is exactly one candidate from that record's `ipaCandidates["en-US"]` | pass (100/100) |
| 10 | `ipaUK` is exactly one candidate from that record's `ipaCandidates["en-GB"]` | pass (93 records) |
| 11 | 7 records have **no** en-GB candidate → `ipaUK`, `approxUK` empty and `ipaEvidenceUK` = `"unavailable"` | pass |
| 12 | `ipaUS`/`ipaUK` are single slash-delimited IPA (no multi-variant strings) | pass |
| 13 | Every non-empty IPA has a matching non-empty approx, and vice versa | pass |
| 14 | `ipaEvidenceUS`/`ipaEvidenceUK` use the `ipa-dict/en_US:` / `en_UK:` form with the right lookup lemma | pass |
| 15 | `example` contains `displayWord` at a **word boundary** (regex `(?<![\w])word(?![\w])`, case-insensitive) | pass after 8 fixes |
| 16 | Example length within 3–12 words | pass |
| 17 | No example repeated inside the batch | pass (100 unique) |
| 18 | No example collides with the 900 A1 examples in `data/enrichment.json` | pass |
| 19 | `translationEvidence` is either a supplied `dictionaryCandidates[].entry` or a retrieved `https://` URL | pass (96 lexentry + 4 URL) |
| 20 | Project validator `scripts/level_content.py` run against these rows | see below |

### Errors found and fixed during checking

First validation pass returned 9 errors, all corrected and re-validated to 0:

- **8 examples used an inflected form** (`consequences`, `consists`, `consumes`,
  `Consumers`, `convinced`, `costumes`, `decorated`, `educates`) and therefore
  failed the exact-word-boundary check in `level_content.py`. Rewritten so the
  base form appears literally (`Every delay has a consequence…`, `A consumer
  always compares prices…`, etc.).
- **1 UK IPA typo**: `definite-607` had `/dɪfˈɪnət/` which is not the supplied
  candidate. Corrected to the real candidate `/dˈɛfɪnət/` and `approxUK` to
  `def-ı-nıt`.

A second, manual read-through of all 100 records caught further problems that
the automated checks do **not** detect. These were also fixed:

- `contact-673` is a **noun** record but the example used the verb
  ("Please contact me…"). Replaced with a noun construction.
- **18 cards had two-word translations** ("güncel, şu anki", "küçük ev, evcik",
  "sevmemek, hoşlanmamak", …). The contract asks for ONE sense; all reduced to a
  single reading.
- **16 approximate readings** used `ə` or were otherwise inconsistent with the
  house style already used in `content-work/batches/batch-01.json` (`/ə/` → `ı`,
  `/θ/` → `th`). Corrected (e.g. `client` `klay-ənt` → `klay-ınt`).

## Evidence handling

**96 of 100** records cite a supplied WikDict lexentry string, e.g.
`eng/conclusion__Noun__1`. Sense selection was done by reading the
`sense`/`translations` fields, not by taking the top-scoring row. Cases where
that mattered:

- `deliver-647`: top candidate was "doğurmak" (to give birth); chose
  "teslim etmek" from the same lexentry for B1.
- `dislike-648`: only candidate translation was "kabul etmemek" (*not to like*),
  which is wrong; taught "sevmemek" and recorded the mismatch in `contentNote`.
- `contrast-717`: candidate said "paradoks"; that is a mistranslation of
  *contrast* (= farklılık), documented in `contentNote`.
- `destination-734`: candidate said "alınyazısı" (fate); taught "varış yeri",
  documented.
- `competitive-500`: snapshot senses were narrow economics glosses
  ("of price: cheap"); taught the everyday "rekabetçi", documented.
- Noun/verb POS was chosen where a homograph offered both: `costume`
  (`/ˈkɑstum/` noun, not `/kɑˈstum/` verb), `current` (`/ˈkɝənt/` adj, not
  `/ˈkɝnt/` noun "akıntı"), `content1` (`/ˈkɑntɛnt/` noun, not
  `/kənˈtɛnt/` adj "memnun"), `damage`, `discount`, `decade`.

**4 of 100** (`coloured-400`, `covered-578`, `dressed-794`, `due-828`) have a
supplied dictionary candidate whose `entry` is `null`, so no lexentry string
exists to cite. For these I retrieved real Wiktionary pages over HTTP and cited
the URL, recording the retrieval in `contentNote`:

- `https://en.wiktionary.org/api/rest_v1/page/definition/colored`
- `https://en.wiktionary.org/api/rest_v1/page/definition/covered`
- `https://en.wiktionary.org/api/rest_v1/page/definition/dressed`
- `https://en.wiktionary.org/api/rest_v1/page/definition/due`

All four were fetched during authoring and the adjective senses re-verified as
live before finishing. Note `coloured` itself is defined only as the British
spelling of `colored`, so that record cites the `colored` page where the
substantive "Having a color" sense is actually defined.

All 100 records have `needsExternal: []` in the input; no field was left blank
for a parent to fill.

## Unresolved / needs parent action

1. **`scripts/level_content.py` will reject the 4 URL-evidence records** until
   the parent records them in `external-evidence.json`
   (`externalEvidence.translations.sourceUrl`). Its own check reads
   `translation evidence URL is not the retrieved one`. Authoring cannot fix
   this from the batch file alone.
2. **`scripts/level_content.py` crashes on the current evidence file.** It does
   `proofs = {e['id']: e for e in evidence}` but
   `content-work/evidence-a2b1b2.json` keys records as `sourceId`, so it raises
   `KeyError: 'id'` before validating anything. I ran it with an in-memory
   `id` alias only; I did not modify the script or the evidence file, as the
   contract forbids it. The parent will hit this on merge.
3. **`scripts/level_content.py` expects every B1 ID in one call.** Running it on
   this batch alone reports ~500 "Missing IDs" for the other six B1 batches.
   That is expected and is not a defect in this batch; it only clears when all
   seven batches are merged.
4. **Cross-batch example collisions are only partially provable.** I checked
   against the 900 A1 examples and against every other `batch-0*.json` /
   `a2-*` / `b1-*` / `b2-*` file present on disk. The other A2/B1/B2 batches are
   still inputs (no authored `batches/*.json` yet), so collisions with *future*
   sibling batches cannot be ruled out. The parent merge runs the whole-corpus
   duplicate check, which is the real gate.
5. **`competitive`, `contrast`, `destination`, `dislike`, `current`,
   `commit`, `commercial`** are authored against a teaching sense that the
   offline snapshot glosses poorly or wrongly. The reasoning is in each
   `contentNote`, but an editor may prefer a different sense. These are the
   cards most likely to need revision.
6. **No audio, TTS or pronunciation scoring was performed**, and no card was
   read to a human or checked by a native speaker. `humanReviewed` must stay
   `false`.

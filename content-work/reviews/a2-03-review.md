# A2 batch 03 — authoring & verification review

**Batch:** `content-work/batches/a2-03.json`
**Input:** `content-work/inputs/a2-03.json`
**Contract:** `content-work/AUTHORING-AB.md` (with `content-work/AUTHORING.md` for A1 context)
**Records written:** 100 (JSON array, one object per input record, input order preserved)

---

## 1. What was actually done

Every one of the 100 records was authored by hand: translation, example, exampleTr,
`approxUS`/`approxUK`, `topicTags` and `selectedSense` were written individually for
that specific word. Nothing was templated or bulk-generated from the headword.

Selection was evidence-driven, not first-hit-driven. For each word I read the
`dictionaryCandidates` glosses/POS and chose the sense that matches the A2 register, then
wrote a fresh Turkish rendering rather than copying the raw gloss list:

- `exact-1025` — WikDict glosses only "dakik"; taught as **kesin** (Cambridge English–Turkish:
  "tam doğru, kesin"), documented in `contentNote`.
- `differently-536` — WikDict gloss "başka" is a poor A2 rendering; taught as
  **farklı şekilde**, documented in `contentNote`.
- `extremely-926` — WikDict gloss "aşırı" for an adverb; taught as **son derece**.
- `fan-994` — three candidates (vantilatör / yelpaze / taraftar). Took **hayran**
  (`eng/fan__Noun__2`, "admirer") as the A2-dominant sense; alternatives noted.
- `figure-867` — the only noun candidate is "drawing/şekil", though A2 learners meet
  "sayı, rakam" far more often. Kept the evidenced **şekil** and noted the number sense
  in `contentNote` so the parent can decide.
- `either-968` — input POS is `det.`, but the only candidate is the conjunction entry.
  Taught the determiner sense (**herhangi biri**), with the conjunction "ya ... ya"
  recorded in `contentNote`.
- `female-823`, `fair-962` — took the adjective candidate (`dişi`, `adil`), not the
  noun homographs (`dişi`/pussy, `fu ar`/fairground).

## 2. Translation evidence

`translationEvidence` is populated on **all 100** cards. No card is blank.

- **93 cards** — the `entry` value of the chosen `dictionaryCandidates` record, e.g.
  `eng/device__Noun__1`. Each was verified to be an actual candidate for that record.
- **6 cards** — a real dictionary URL that I actually retrieved over HTTP during this
  task (Cambridge English–Turkish), because the input had no usable lexentry for the
  target POS:
  `disagree-588`, `driving-810`, `drop-811`, `either-968`, `electrical-988`, `farming-1018`.
  Every one of these URLs was fetched (HTTP 200) and the Turkish glosses were read off
  the page. The `contentNote` on each card records which gloss was used.
- **1 card** — `flying-1019`: source POS is `n.`, but the only candidate is the
  *adjective* entry `eng/flying__Adjective__1` ("uçan"). I verified in
  `content-work/references/en-tr.sqlite3` that `eng/fly__Noun__2` carries
  `sense="act of flying"`, `trans_list="uçuş"`, and used that. This is the alias-lemma
  case AUTHORING.md allows. Flagged in §5.

`needsExternal` is empty for all 100 input records, so the rule-2 "leave it blank"
escape was never used. See §4.1 for the one place I initially got this wrong.

## 3. IPA verification (machine-checked)

| Check | Result |
|---|---|
| `ipaUS` is a verbatim member of that record's `ipaCandidates['en-US']` | 100/100 |
| `ipaUS` is a single `/.../ variant (no comma, no dual form) | 100/100 |
| `ipaUS` re-checked against raw `references/en_US.txt` | 100 lemmas, 0 mismatches |
| `ipaUK` is a verbatim member of `ipaCandidates['en-GB']` | 98/98 filled |
| `ipaUK` re-checked against raw `references/en_UK.txt` | 98 lemmas, 0 mismatches |
| `ipaUK` blank → `approxUK` also blank, `ipaEvidenceUK = "unavailable"` | 2/2 (`document-696`, `essay-941` — the input has no en-GB candidates) |
| No `approxUK` filled by copying the US value | confirmed |

`ipaEvidenceUS` is `ipa-dict/en_US:<lookupLemma>` on all 100;
`ipaEvidenceUK` is `ipa-dict/en_GB:<lookupLemma>` on the 98 that have UK data and
`unavailable` on the 2 that do not.

`approxUS`/`approxUK` were hand-written per card against the *selected* variant, not
auto-derived. The awkward sounds are handled explicitly and flagged in `contentNote`:
`/æ/` between e and a (`disaster`, `excellent` family, `factor`, `exact`),
`/dʒ/` → c (`education`, `engine`, `energy`, `nature` family),
dark `l` in US (`digital`, `electrical`, `formal`),
`/ŋ/` as a single "ng" (`finger`),
English r ≠ Turkish r (`earn`, `earth`, `forget`-type endings throughout),
`/ɜː/` and `/ɝ/` (`earn`, `expert`, `fever`-type endings),
`/w/` not v (`everywhere`, `forward`),
`/ɪ/` vs `/iː/` US/UK pairs (`discover`, `education`, `disease`, `greedy`-type endings).

## 4. Errors I hit, and what I did

### 4.1 `disagree-588` — I wrongly left the translation blank (fixed)
The input's `needsExternal` field for this record is `[]` and `dictionaryCandidates` is
`[]`. I initially mis-read it as flagged and left `translation` and `translationEvidence`
empty, per the rule-2 instruction. When I audited the input directly I found **no record
in this batch has a non-empty `needsExternal`**, so the blank was unjustified.
Fixed: filled `translation = "anlaşmamak"` from the Cambridge page I had genuinely
fetched ("to have a different opinion from someone else about something = uyuşmamak,
anlaşamamak"), set the URL as evidence, and rewrote the example to match.
Re-audited all 100 records: **0 cards now have an empty `translation` or
`translationEvidence`.**

### 4.2 Examples that only contained an inflection (fixed)
First automated pass caught 6 examples where the display word appeared only inflected,
which rule 4 forbids. Rewritten to the bare form, and checked against the A1 corpus for
collisions before committing:

| card | was | now |
|---|---|---|
| `discover-620` | "They **discovered** a new shop…" | "Scientists **discover** new stars every year." |
| `disappear-592` | "The sun **disappeared**…" | "The fog will **disappear** before noon." |
| `drug-812` | "The police found **drugs** in his bag." | "The police found a **drug** in his bag." |
| `earn-860` | "She **earns** enough money…" | "They can **earn** a good salary in this city." |
| `employ-1056` | "The café **employs** five people." | "Small shops **employ** fewer people now." |
| `fix-955` | "He **fixed** the bike…" | "Can you **fix** my broken chair?" |

### 4.3 `direction-564` — I had pasted the UK pronunciation into `ipaUS` (fixed)
`/daɪˈɹɛkʃən/` is a GB variant. Corrected to the real US candidate
`/daɪˈɹɛkʃɪn/`, with `approxUS` `day-rek-shin` and a `contentNote` explaining the
US `/ɪ/…/ən/` vs UK `/ən/` split.

### 4.4 Turkish quality problems found in the manual read-through (fixed)
I read all 100 finished cards end to end. Nine were wrong or clumsy in Turkish and were
corrected:

- `enormous-853` — exampleTr said "Devasa" while the taught translation is "kocaman";
  now "Kocaman bir ağaç bütün yolu kapattı." (translation and example must agree).
- `following-1043` — "Ertesi gün" did not demonstrate the taught word; now
  "Sonraki gün her şey değişti."
- `finally-887` — example used "nihayet" while the taught word is "sonunda"; example and
  translation now match.
- `fiction-839` — "O kitap bilim kurgu." → "O kitap bir bilim kurgu eseri."
- `direction-564` — "Kütüphane o yönde." → "Kütüphane o tarafta." (more natural Turkish
  for pointing out a direction).
- `extreme-922` — "çok aşırıydı" → "aşırıydı" ("çok aşırı" is a calque).
- `energy-821` — "Çocuklar okulda çok enerjili." was not idiomatic → "Çocukların okulda
  çok enerjisi var."
- `field-843` — "Boş tarlanın karşısından yürüdüler." was a mistranslation of "across"
  → "Boş tarla boyunca yürüdüler."
- `factor-946` — noun-phrase fragment → "Fiyat satın alırken önemli bir etkendir."

## 5. Open items for the parent (not errors, decisions to confirm)

1. **`flying-1019`** — source POS is `n.`; I taught **uçuş** using the alias lexentry
   `eng/fly__Noun__2` (verified present in the reference DB), because the input's only
   candidate is the adjective entry `eng/flying__Adjective__1` ("uçan"). Cambridge lists
   the "flying" noun as a cross-reference to "fly". If you would rather teach the
   adjective ("uçan"), that is a one-field change.
2. **`figure-867`** — I taught the evidenced "şekil" sense. A2 learners will more often
   meet "sayı, rakam" (a number in a report). Worth a parent decision.
3. **`drug-812`** — taught "uyuşturucu" (the evidenced candidate). In A2 materials
   "drug" very often means "ilaç" (medicine). The contentNote records both. Parent call.
4. **`exact-1025` / `extremely-926` / `differently-536`** — I departed from the literal
   WikDict gloss toward the natural modern A2 Turkish. All three are documented in
   `contentNote`; revert if you want strict gloss fidelity.
5. **`either-968`** — taught the determiner sense to match the source POS, not the
   conjunction candidate. See §1.

## 6. Example uniqueness

- 100 unique examples within this batch — 0 duplicates.
- Cross-checked against **all 1800 example sentences** in the other 9 written batch
  files: **0 reused**.
- Word counts 5–9, all inside the required 4–10 band; every sentence uses the taught
  word's base form.

## 7. Final verification run

`verify_a2_03.py` is an independent checker that reads only the written JSON, the input
JSON and the raw reference text files — it does not import the build script.

```
[count]        100 records
[ids]          100 unique ids, all match input exactly, order preserved
[headwords]    all 100 byte-identical to input
[required]     all 13 required fields populated (except documented needsExternal gap)
[ipaUS]        100/100 found verbatim in ipaCandidates['en-US'], single /.../ variant each
[ipaUS/en_US]  100 lemmas cross-checked against references/en_US.txt, 0 mismatches
[ipaUK]        98 filled from real en-GB candidates; 2 blank+unavailable (no US copying, no UK manufacturing)
[examples]     100/100 contain displayWord with word boundaries
[dedupe]       0 duplicates in batch; 0 of 100 reused from 1800 examples in the other 9 written batches
[length]       min 5 / max 9 words; 0 outside 4-10
[topicTags]    100/100 valid, 1-3 tags each, all from the allowed list
[speech]       speechText == displayWord for all 100
[displayWord]  0 parenthesised homographs, 100 plain headwords
[claims]       no human-review/approval claims in the file

RESULT: PASS — all independent checks succeeded
```

## 8. Honest limits

- **No human or native-speaker review has taken place.** Every statement above is a
  machine check or my own authoring judgment, nothing more. The Turkish and the
  approximate-pronunciation hints in particular have not been validated by a second
  person, and `approxUS` is a teaching aid, not a phonetic transcription.
- The machine checks can confirm that `ipaUS` is one of the supplied candidates and that
  examples are unique and contain the target word. They **cannot** confirm that a
  translation is idiomatic or that an example is pedagogically the best choice.
- The 6 URL-based evidence citations are backed by pages I fetched during this task, but
  those are live external pages and could change later.
- I did not verify anything about the other batches beyond reading their example
  sentences for duplication.

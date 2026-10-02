# Author review: a2-08

Status: AI-assisted authoring draft. **Not human-reviewed**, not editorially
reviewed, not a pronunciation assessment. All Turkish approximate readings are
hand-written learning aids, not phonetic authority.

## Scope completed

- `content-work/batches/a2-08.json`: authored all 100 input IDs.
- Output is a JSON array with exactly 100 objects, in input order.
- Input file `content-work/inputs/a2-08.json` read in full (100 records,
  including `needsExternal`, `ipaCandidates` and `dictionaryCandidates`).

## Automated checks actually run (Python)

| Check | Result |
|---|---|
| Record count == 100 | pass (100) |
| `sourceId` set == input set (order preserved too) | pass, 100/100 exact match |
| Duplicate `sourceId` | none (100 unique) |
| `headword` byte-identical to input | pass, all 100 |
| `displayWord` == `speechText` == input `displayWordHint` | pass, all 100 |
| All 13 required fields present and non-empty (except the documented `used to` IPA gap) | pass |
| `ipaUS` present verbatim in that record's `ipaCandidates["en-US"]` (comma-split, exact string match) | pass for 99; 1 intentionally empty |
| `ipaUK` present verbatim in `ipaCandidates["en-GB"]` | pass for 94; 6 have no en-GB candidate |
| `ipaEvidenceUS`/`ipaEvidenceUK` == `ipa-dict/en_US:<lemma>` / `en_UK:<lemma>` | pass; `unavailable` used for all 6 empty UK cases |
| `approxUS`/`approxUK` non-empty exactly when IPA present | pass, all 100 |
| `example` contains `displayWord` with word boundaries (`(?<![\w'-])…(?![\w'-])`, case-insensitive) | pass, all 100 |
| Example ends in terminal punctuation | pass, all 100 |
| Example length 4–10 words | pass (actual range 6–10) |
| `topicTags` 1–3 items, all from the allowed list | pass, all 100 |
| `translationEvidence` is a real lexentry present in that record's input `dictionaryCandidates` | pass for 98; 2 documented exceptions (`tablet`, `worse`) |
| Duplicate examples within batch | 0 |
| Examples duplicated anywhere else in repo (22 files / 1647 examples scanned, incl. all A1 `batch-01..09`, `data/words.json`, `data/enrichment*.json`) | 0 |
| Shared 5-word opening with any existing repo example (near-duplicate proxy) | 0 |

Every `approxUS`/`approxUK` value was written by hand per word against the
selected IPA — no character-map generation was used as final content. Hard
sounds carry a `contentNote` (`/θ/` in thick/thin/thief/toss, `/ɹ/` in
support/war/vehicle, `/ŋ/` in sudden/washing/training, `/ʃ/` in wish/suggestion,
`/ʒ/` in unusual/usual, `/v/` in vehicle, `/æ/` in valley/van).

## Errors found and fixed during the run

First validation pass returned 7 errors, all corrected and re-verified:

- `support-2664`, `user-2828` — examples used an inflected form (`supports`,
  `users`); rewritten so the exact display word stands alone.
- `trainer-2710`, `traveller-2746`, `winner-2782` — `ipaUK` had been written
  with a schwa `ə` instead of the candidate's `ɐ`; corrected to the literal
  en-GB candidates.
- `towards-2666` — `ipaEvidenceUK` lemma corrected to the headword form
  `towards` (input `translationLookup` is `toward`, but the candidates and the
  taught word are `towards`; en-GB `toward` and `towards` differ by the final
  /d/ vs /dz/, so the lemma had to follow the taught word).
- `temperature-2613` — tag `science` is not in the allowed list; replaced with
  `descriptions`.

A second semantic read-through then fixed 11 content problems: Turkish
agreement/tense slips (`target`, `throw`, `track`, `transport`, `wheel`, `wide`),
an example that contradicted its own sense (`weight` — "lost weight" vs the
taught noun "ağırlık"), a redundant sentence (`united`), a translation that was
too vague for A2 (`teenage` → `ergen`), an unsuitable tag pair (`toy`), and two
bad `acceptedAnswers`: `who's` was listed as acceptable for `whose` (it is a
different word — removed and replaced with an explicit warning note) and
`themself` for `themselves` (removed).

## needsExternal records — not invented

- **`used-to-2820`** (`no-en-US-IPA-candidate`): `ipaUS`, `approxUS`, `ipaUK`,
  `approxUK` left **empty**. I checked `references/en_US.txt` and `en_UK.txt`
  directly: neither contains a `used to` entry at all (only `used /ˈjuzd/` and
  `use /ˈjus/`/`/ˈjuz/`). No pronunciation was fabricated.
  `translationEvidence` = `eng/used_to__Verb__1` (real, in input).
- **`worse-2874`** (`no-translation-candidate`): no usable `eng/worse__Adjective__*`
  entry exists in `references/en-tr.sqlite3`. I queried it: the only `worse`
  rows are `worse_for_wear` ("drunk"), `the_cure_is_worse_than_the_disease` and
  `worsen` — none supports the comparative sense being taught. Per the contract
  the field is **not fabricated**; it carries the literal string
  `needs-external: no suitable dictionaryCandidates entry for 'worse' (see contentNote)'`
  so the parent can fill it from external evidence. Both IPAs were real
  candidates and are filled in normally.

## Evidence exceptions the parent must review

1. **`tablet-2493`** — the only input candidate was
   `eng/tablet__Noun__1` "slab of clay / levha", which is not an A2 word for a
   learner. I queried the same local reference DB and used the real lexentry
   `eng/tablet_computer__Noun__1` ("hand-held portable computer in the form of a
   tablet" → *tablet bilgisayarı*). `translationEvidence` is therefore
   `external:references/en-tr.sqlite3#eng/tablet_computer__Noun__1` — it is
   **not** in the input candidate list. Flagged so the parent can confirm or
   substitute the supplied candidate.
2. **`variety-2860`** — both input candidates were botanical ("görünüş", "dal").
   I taught the everyday sense *çeşitlilik* but kept
   `translationEvidence: eng/variety__Noun__1` because that is the only real
   lexentry available. The sense text in the input does **not** support the
   taught meaning; flagged for external confirmation.
3. **`underground-2907`** — input candidate sense was "outside the mainstream";
   taught sense is the everyday "yer altı / metro" one, same lexentry.
4. **`working-2854`** — input gave "işlevsel" / "emek"; taught "çalışır durumda"
   (functioning), same lexentry.
5. **Bad input translations corrected and documented in-card**: `tidy`
   ("aylık" → *derli toplu*), `teaching` ("hoca" → *öğretim*), `wooden`
   ("odun" → *tahta*), `worried` ("acı acı" → *endişeli*), `washing`
   ("aklama" → *çamaşır yıkama*), `typical` (first candidate "kopya" ignored),
   `top`/`web`/`wave`/`tip` — alternative (off-topic or A2-inappropriate) senses
   passed over in favour of the everyday one.
6. **`wind1-2996`** — homograph: `headword` kept as `wind1`, `displayWord`/
   `speechText` = `wind` per `displayWordHint`. Chose `/ˈwɪnd/` (noun) over
   `/ˈwaɪnd/` (verb), documented in-card. No en-GB candidate.

## Unresolved

- `used to` and `worse` still need parent-supplied external evidence (IPA and
  translation respectively).
- `tablet`, `variety`, `underground`, `working` sense choices rest on a lexentry
  whose input sense text does not match the taught meaning.
- 94/100 cards carry UK IPA; 6 have none available upstream. Nothing was
  manufactured to fill them.
- Turkish approximate readings and the naturalness of every example sentence
  still need a native-speaker linguistic pass. Automated checks above prove
  structure, coverage and uniqueness only.
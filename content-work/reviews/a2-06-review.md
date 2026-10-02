# a2-06 review

## Scope and status

- Authored 100 records from `content-work/inputs/a2-06.json` into
  `content-work/batches/a2-06.json`, in input order.
- Content is an AI-assisted editorial draft. It is **not human-reviewed**, not
  editorially approved, and carries no pronunciation-teacher sign-off.
- Each record was written individually for one intended A2 sense and POS, with a
  hand-written Turkish reading aid matched to the selected IPA.

## Checks actually run (Python, against the written file)

| # | Check | Result |
|---|-------|--------|
| A | Record count == 100 | pass (100) |
| B | `sourceId` list identical to input, same order | pass |
| C | `headword` byte-identical to input (incl. `race (competition)`, `refuse1`, `rock (stone)`, `rest (remaining part)`) | pass 100/100 |
| D | Every non-empty `ipaUS` appears verbatim in that record's own `ipaCandidates['en-US']` | pass 99/99 (1 intentionally empty) |
| E | Every `example` contains `displayWord` at word boundaries (`(?<![\w])…(?![\w])`, case-insensitive) | pass 100/100 |
| F | Example sentences unique within the batch | pass (100 distinct) |
| G | No example collides with any of the 900 existing A1 batch sentences | pass (0 collisions) |
| H | Required string fields non-empty (excl. the documented `per cent` gap) | pass |
| I | `speechText == displayWord` | pass 100/100 |
| J | `topicTags` 1–3 items, all from the allowed list | pass 100/100 |
| K | `translationEvidence` is a supplied WikDict lexentry or a retrieved URL | pass 96 + 3 + 1 empty |
| L | US/UK IPA pair completeness; UK empty ⇒ `ipaEvidenceUK: "unavailable"` | pass |
| M | Single slash-delimited `/…/` variant, base form / taught POS, not a past-tense reading | pass after fixes |
| N | Example length 6–9 words, capitalised, terminal punctuation | pass 100/100 |

Repository gate `scripts/level_content.py::validate_rows` was also run on this
file. It reports 10 errors, all in the two expected classes described below; no
other row is flagged.

## Fields left blank on purpose

`per-cent-1838` has `needsExternal: ['no-en-US-IPA-candidate',
'no-translation-candidate']`. Per the contract I did **not** invent the missing
values. Blank: `translation`, `ipaUS`, `approxUS`, `translationEvidence`,
`ipaEvidenceUS`. `contentNote` states the gap and that the parent supplies
external evidence. `topicTags`, `selectedSense`, `example`, `exampleTr` and
headword/IDs are authored normally so the card is complete apart from the
evidence itself.

## Evidence exceptions I inspected and corrected

Supplied dictionary candidates that did not support the intended A2 meaning, or
that had no lexentry at all:

- `petrol-1907` — all supplied candidates had `entry: null` (only a bare
  `benzin` string, score 2). Retrieved
  `https://dictionary.cambridge.org/us/dictionary/english/petrol`, which defines
  petrol as "a liquid obtained from petroleum, used especially as a fuel for
  cars and other vehicles" and tags it **A2**, with the US variant given as
  *gas*. Used as `translationEvidence`.
- `replace-2184` — same `entry: null` situation. Retrieved
  `https://dictionary.cambridge.org/us/dictionary/english/replace`; the sense
  chosen ("to change something that is old, damaged, lost, etc. for something
  newer or better") matches the taught `değiştirmek`.
- `rest-remaining-part--2281` — supplied candidates only covered *sleep/rest
  relief* ("dinlenme", "mola"), not "remaining part". Retrieved
  `https://dictionary.cambridge.org/us/dictionary/english/rest`; the chosen sense
  matches "the other things, people, or parts that remain or that have not been
  mentioned".
- `pop-2145` — top Turkish candidate was `baba` (wrong) and `papaz` for the pop
  music sense (wrong gloss). Chose the pop-music sense from the English gloss
  and the `eng/pop__Noun__3` lexentry.
- `quietly-2099` — only candidate translation was `huzurlu`, which does not
  express "in a quiet manner". Used the English gloss and the same lexentry.
- `provide-1979` — highest-scored candidate was `öngörmek` ("to establish as a
  previous condition"), wrong for A2. Selected the "furnish/supply" sense from
  the same `eng/provide__Verb__1` lexentry.
- `recording-2004` — supplied translations `fotoğraf` do not match the stored
  sound/video sense; used `kayıt` with the same lexentry.
- `public-1995`, `reply-2188` — source POS is adjective/verb but only a noun
  lexentry was supplied; the same lexentry was cited and noted in `contentNote`.
- Homograph pairs split deliberately: `pick` (toplamak, verb) vs the noun
  senses; `position` (yer) vs `görüş`; `pet` (evcil hayvan); `ring1` (yüzük) vs
  `ring2` (çalmak); `rock (stone)` (kaya) vs `rock (music)` (rock müzik);
  `rest (remaining part)` (kalan kısım) vs `rest (sleep/relax)` (dinlenme).
  `raise` vs `rise` kept distinct in both `contentNote`s.
- Note on `raise`/`race`/`rise`: A1 batches already contain examples for `raise`
  and `rock`, so I wrote different sentences; no sentence is shared.

## Corrections made during validation

1. Four `ipaUK` values I first typed did not match the supplied en-GB
   candidates (`recently-1976`, `recipe-1984`, `relationship-2092`,
   `researcher-2229`). Replaced with the verbatim candidate strings; all now
   pass check D/M.
2. Seven examples only *inflected* the target word (`pennies`, `produces`,
   `programme`, `protects`, `provides`, `reached`, `responded`), which fails the
   exact-target rule. Rewrote each so the base form appears: e.g.
   `produce` → "This farm will produce milk for the region.";
   `program` → "What is your favourite TV program?" (also corrected the British
   `programme` spelling in an A2 US-first card).

## Unresolved / for the parent

- `per-cent-1838` cannot pass `validate_rows` until the parent supplies external
  IPA and a dictionary translation. The other nine validator messages are
  consequences of the three retrieved URLs not yet being registered in
  `evidence-a2b1b2.json` under `externalEvidence.translations.sourceUrl`; the
  URLs above were genuinely fetched (HTTP 200, definitions read from the pages),
  so they should register cleanly.
- en-GB IPA is empty for 11 records whose input had no en-GB candidate
  (`process`, `produce`, `progress`, `realize`, `recognize`, `record`,
  `refuse1`, `repair`, `research`, `review`, `per cent`). US IPA was not copied
  into the UK slots.
- Turkish reading aids are approximations for A2 learners, not phonetic
  authority. Difficult segments (`/æ/`, `/ɝ/`, `/ŋ/`, `/ʊ/`, `/ʌ/`, rhotic
  vowels, syllable-final /t/) are flagged individually in `contentNote`.
- `speechText` for `per cent` is the phrase itself; a TTS provider may read it
  as "per cent" rather than the numeral, which is untested here.
- Cross-batch example uniqueness was re-checked after the sibling level files
  appeared: against all 1580 records currently on disk (9 A1 batches plus
  `a2-01`, `a2-02`, `a2-04`, `a2-05`, `a2-07` and the `a2-08` parts) there are
  **0** example collisions and **0** headword collisions with this batch. B1 and
  B2 output files do not exist yet, so one more corpus-wide pass is needed once
  they land.
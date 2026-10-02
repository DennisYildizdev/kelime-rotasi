# b1-01 author review

Date: 2026-10-01
Batch: `content-work/batches/b1-01.json`
Input: `content-work/inputs/b1-01.json`
Status: AI-assisted draft; not human-reviewed, not pronunciation-scored, not
speaker-verified.

## Coverage

- Authored exactly 100 records for the 100 IDs in the input file.
- `sourceId` and `headword` are byte-identical to the input for every record
  (verified in input order, not just as a set).
- 100 unique `sourceId` values; no duplicates.
- Homograph annotation preserved in `headword` (`bank (river)`), with
  `displayWord`/`speechText` reduced to the bare word `bank`.
- Every record has a `contentNote`. No record claims human review.

## Checks actually run (Python, against the written file on disk)

| Check | Result |
|---|---|
| Record count | 100 |
| `sourceId` list equals input `sourceId` list, in order | pass |
| `headword` identical to input | 100/100 |
| `speechText == displayWord` | 100/100 |
| `ipaUS` found verbatim (slash-delimited) inside that record's own `ipaCandidates["en-US"]` | 99/100 |
| `ipaUK` found verbatim inside that record's own `ipaCandidates["en-GB"]` | 97/97 |
| UK fields empty **and** `ipaEvidenceUK == "unavailable"` where en-GB is missing | 3/3 |
| `displayWord` present in `example` at word boundaries (case-insensitive regex, non-letter lookahead) | 100/100 |
| `example` unique inside the batch | 100/100 |
| `example` collides with any of the 900 A1 examples in `content-work/batches/batch-0*.json` | 0 |
| Example length 4–11 word tokens | 100/100 |
| `topicTags` count 1–3 and all from the allowed list | 100/100 |
| `translationEvidence` starting with `eng/` exists as a real `lexentry` in `content-work/references/en-tr.sqlite3` | 97/97 |
| Required fields present and non-empty (excluding the documented `analyse-158` exception) | 100/100 |

Multi-variant US candidates were resolved to a single slash-delimited option
in every case: `advise-209` (chose /ədˈvaɪz/), `aged-2` (/ˈeɪdʒd/),
`analysis-162` (/əˈnæɫəsəs/), `announcement-202` (/əˈnaʊnsmənt/),
`basis-172` (/ˈbeɪsəs/), `bomb-453` (/ˈbɑm/), `calm-438` (/ˈkɑɫm/),
`candidate-478` (/ˈkændədeɪt/), `chemical-443` (/ˈkɛmɪkəɫ/). No past-tense
reading and no wrong-POS noun/verb reading was used.

`approxUS`/`approxUK` were written by hand per word, not character-mapped.
Hard sounds are called out in `contentNote`: /θ/ and /ð/ (breath, breathe,
breathing), dark /ɫ/ (alarm, album, balance, ceiling, celebration, bubble,
channel, cheerful, chemical), English /ɹ/ vs Turkish r (admire, arrival,
battery, border, bother, bury, backwards),
/ŋ/ not a separate g (bank), /w/ not v (aware),
/æ/ between e and a (academic, access, ad, album, alcohol, analysis,
atmosphere, basic, balance, ban, bubble, candidate, cap, captain, category,
chemical), /ɝ/ r-rolled (arrest, arrival), /ʌ/ (bubble), /dʒ/ written as c
(aged, agent, apologize, challenge, charge), /tʃ/ as ç
(attach, branch, chain, chest, channel).

## Sense-selection decisions worth reviewer's attention

The supplied WikDict candidates were often wrong POS or wrong sense for the
B1 target. Each deviation is recorded in that record's `contentNote`.

- `academic-37`: source POS is adj., the only candidate is the noun
  "akademisyen". Taught "akademik"; evidence switched to
  `eng/academical__Adjective__1` from the same downloaded dictionary.
- `achievement-85`: candidate gloss is the video-game sense "başarım". Taught
  the general B1 sense "başarı".
- `advanced-181`, `analyse-158`: no `translation` lexentry exists at all in the
  reference DB (only the simple_translation table). `translationEvidence`
  points at that table row and says so.
- `apart-11`: candidates only give "ötede" / "(abl) kopuk". Taught the
  distance sense "ayrı".
- `assist-207`: the only verb candidate is the football pass "asist". Taught
  "yardım etmek"; the note names the supporting `assistance` entry.
- `balance-116`, `ban-124`, `aim-46`, `basic-164`: candidate translations
  ("bakiye", "yasak", "maksat", "asıl") are poor for B1. Modern senses
  ("denge", "yasaklamak", "amaçlamak", "temel") were used instead.
- `bank-river--140`: homograph sense is river bank; the input candidates for
  this lemma are all finance/sandbank senses. Taught "kıyı" with
  `eng/bank__Noun__2` cited and the mismatch noted.
- `block-413`: noun sense "ada" taught (source POS is n.); note records that
  Turkish also says "blok" for an apartment block.
- `bomb-453`: tags are `descriptions`/`culture`; there is no "news" tag in the
  allowed list.
- `backwards-92`: no `backwards` lexentry; `eng/backward__Adjective__1` used.
- Other POS/lexentry mismatches where a real dictionary entry did support the
  taught sense: `academic`, `alcoholic` (adj. → "alkollü"), `appointment`,
  `application`, `charge`, `cheat`, `cheerful`, `chest`, `ceremony`. Each
  taught sense is stated in English in `selectedSense` so the choice is
  auditable.

## Unresolved / left for the parent

1. `analyse-158` — `ipaUS` and `approxUS` are **empty on purpose**. The input
   carries `needsExternal: ["no-en-US-IPA-candidate"]`, and the local
   `en_US.txt` snapshot contains only `analyze /ˈænəˌɫaɪz/`, not the `-yse`
   spelling. Per AUTHORING-AB.md rule 2 nothing was invented; external
   evidence must be supplied by the parent. `ipaUK`/`approxUK` were filled
   from the supplied en-GB candidate (`/ˈænɐlˌaɪz/`).
2. `aged-2`, `apologize-19`, `charge-403` — no en-GB candidate in the input;
   `ipaUK`/`approxUK` left empty with `ipaEvidenceUK: "unavailable"`. No UK
   value was copied from US.
3. `translationEvidence` for `advanced-181`, `analyse-158`, `apart-11` is not a
   WikDict `lexentry` string (no lexentry exists). If the parent validator
   requires the `eng/…` shape for every record, these three will need a
   different evidence convention or will show up as outliers.
4. Example sentences were checked for uniqueness against the 900 A1 examples
   and against this batch only. The other A2/B1/B2 batches are not authored
   yet, so a cross-batch collision cannot be ruled out from here; the parent
   merge should re-run the duplicate check globally.
5. Turkish sentences and the Turkish reading aids were reviewed by the author
   (this agent) only. They are approximations and drafts, not a native-speaker
   or phonetics authority.

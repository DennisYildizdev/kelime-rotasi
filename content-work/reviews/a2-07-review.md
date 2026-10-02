# a2-07 batch review

Batch: `content-work/inputs/a2-07.json` → `content-work/batches/a2-07.json`
Scope: 100 A2 records (words S–T region of the A2 list, with 2 numbered gaps in the
`sourceId` numbering inherited from the input).
Status: **draft, AI-assisted. Not editorially reviewed, no human approval, no audio
recording, no pronunciation scoring.**

## Automated checks actually run

A Python script (`a207_merge.py`, scratch dir) wrote the batch by joining the input file
with authored content, then re-read the written JSON from disk and checked:

| check | result |
|---|---|
| file is a JSON array with exactly 100 records | PASS (100) |
| all `sourceId` unique | PASS |
| `sourceId` list identical to input, in the same order (exact string compare) | PASS |
| `headword` identical to input for every record | PASS |
| `speechText` == `displayWord` | PASS |
| every `ipaUS` (slashes stripped) is an exact match of one of that record's own `ipaCandidates["en-US"]` | PASS (0 mismatches) |
| `ipaUK` exact match of an `en-GB` candidate where one exists; empty + `ipaEvidenceUK: "unavailable"` where the input has no en-GB candidate | PASS |
| `approxUK` non-empty exactly for the 97 records that have an en-GB candidate | PASS |
| every `example` contains `displayWord` with word boundaries (`(?<![A-Za-z])…(?![A-Za-z])`, case-insensitive) | PASS (after fixes, see below) |
| example length 4–12 words | PASS (range 6–9) |
| no duplicate `example` inside the batch | PASS |
| no `example` reused from the 900 A1 cards in `content-work/batches/batch-01…09.json` | PASS |
| `topicTags` 1–3 items, all from the allowed list | PASS |
| `translationEvidence` is a real `entry` value from that record's `dictionaryCandidates` | PASS |
| required fields present and non-empty (UK fields exempt when input has no en-GB) | PASS |

`needsExternal` was non-empty on **0 of 100** records, so no field was left blank for
external follow-up. 60 records carry a word-specific `contentNote`; 10 verbs carry
`acceptedAnswers`.

## Errors found and fixed during verification

1. **Inflected target word (3 records).** First draft used `He shakes his head…`,
   `He smiled and offered…`, `She worked hard and succeeded…` — the target appeared only
   as an inflection, which fails the word-boundary rule and the "not an inflection alone"
   rule. Rewritten to bare base forms: `They shake hands before every match.`,
   `I always smile when I see my friends.`, `You can succeed if you practise every day.`
2. **Validator bug (not a content bug).** My first check flagged `ipaUK`/`approxUK` as
   "empty required fields" on `secret-2403`, `separate-2482`, `smartphone-2356`. Those three
   have **no** en-GB candidate in the input, so the contract requires all three UK fields
   to stay empty. The check was corrected to exempt them; content was left unchanged.
3. **Read-through corrections (9 records).** Tightened or improved after reading every card:
   - `rubbish-2450` translation narrowed to one meaning: `saçma, anlamsız` → `saçma`.
   - `straight-2759` translation narrowed to one meaning: `düz, doğrudan` → `düz`.
   - `sailing-2230` example reworded (`Sailing boats are easy to rent in summer.` / `Yazın
     yelkenli tekne kiralamak kolay.`) because the previous Turkish sentence was awkward.
   - `soap-2389` `exampleTr` fixed to natural Turkish (`Ellerini ılık su ve sabunda yıka.`).
   - `sign-2440` `exampleTr` reworded; `structure-2536` `exampleTr` reworded
     (`Köprünün sağlam bir çelik yapısı var.`).
   - `step-2707` example replaced (`The baby took her first step today.`) so the noun is not
     only seen inside the idiom "step by step".
   - `schedule-2322` `approxUS` `sedjul` → `skedjul` (the selected IPA starts with `/sk/`).
   - `runner-2470` `approxUK` `ra-nə` → `ra-ner` (Turkish letters only; `ə` is not Turkish).

## Evidence / sense decisions worth flagging to the parent

- **No verb candidate exists for `score-2346`.** Input `pos` is `v.` but
  `dictionaryCandidates` contains only `eng/score__Noun__1`, whose `translations` field is
  the corrupt string `"not"`. The verb translation `puan almak` is authored, and the same
  lexentry is cited as evidence with an explicit `contentNote`. Same situation for
  **`shake-2295`** (verb sense exists but only as "transitive: to cause to move / çalkalamak";
  modern `sallamak` used) and **`sort-2483`** (noun gloss "cins | soy" → `çeşit`).
- **Source POS vs dictionary POS mismatches** (source says `adj.`/`adv.`/`n.` but the dump is
  dominated by another POS) — card teaches the source POS, evidence cites the closest
  matching lexentry, `contentNote` documents it: `square-2615` (adj, used
  `eng/square__Adjective__1` "shaped like a square"), `straight-2759` (adv, only adjective
  entries exist), `store-2747` (n, dictionary gives "stok/depo"; modern `mağaza` used).
- **Deliberate narrower senses where the dump offers several** (alternative senses recorded in
  `contentNote`): `rubbish` (taught "nonsense/saçma", the far more frequent BrE "çöp" has no
  noun evidence in the dump), `sense` (`anlam`, not `duyu`), `seat` (`sandalye`), `size`
  (`boyut`, example asks about clothing size), `sign` (`işaret`, not `tabela`/`imzalamak`),
  `stage` (`sahne`, not `evre`), `state` (`durum`, not `devlet`), `stress` (`stres`, not
  `vurgu`), `speaker` (`konuşmacı`, not `hoparlör`), `save` (`kaydetmek`, not `kurtarmak`),
  `sale` (`satış`, not `indirim`), `solution` (`çözüm`, not `çözelti`), `stone` (`taş`, not
  `çekirdek`), `stamp` (`mühür`; postage use `pul` noted), `sir` (`efendim`), `size`.
- **`specific-2535`**: the dump only offers the technical gloss `bağıl`; `belirli` used as the
  modern A2 equivalent for "intended for a particular thing", documented in `contentNote`.
- **`shall-2299`**: taught as the A2 suggestion/offer modal (`Shall we …?` = `…elim mi?`),
  translation `olacak` follows the dump's "indicating the simple future tense"; the usage
  pattern is spelled out in `contentNote`.

## Unresolved / not verified

- **Turkish approximate readings are authored drafts, not phonetic authority.** `/æ/`,
  `/ə/`, `/ʌ/`, `/w/`, `/ŋ/`, English `/r/` and the r-coloured vowels cannot be represented
  faithfully in Turkish orthography. UK readings that differ from US were written by hand
  (e.g. `serve` `sörv`, `search` `sörç`, `stair` `ster`, `sir` `sör`) but have not been
  checked by a speaker.
- **No human linguistic or editorial review.** Turkish `exampleTr` sentences, `selectedSense`
  wording and topic-tag choices are machine-drafted.
- **IPA selection is one valid candidate, not a judgement about the best pronunciation.**
  Where the input offered two variants I picked the one matching the taught POS (e.g.
  `/ˈsɝvɪs/` for service, `/ˈstupɪd/` for stupid, `/ˈsɛpɝɪt/` for the adjective *separate*
  rather than the verb `/ˈsɛpɝˌeɪt/`); a speaker should confirm regional variants.
- **Cross-batch example uniqueness** was first checked against the 900 A1 cards
  (`batch-01…09`). A re-check was then run at the end of the task against every other batch
  file that existed in `content-work/batches/` at that moment (`a2-01`, `a2-02`, `a2-04`,
  `a2-05`): **0 example collisions**, and **0 headword overlaps** between this batch and those
  four. Batches written later (or after that snapshot) still need a collision re-check.
- The parent must still run its own independent validation and merge; nothing here is
  approved for release.
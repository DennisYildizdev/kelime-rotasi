# A1 content authoring contract

Work only in your assigned content-work/batches/batch-NN.json and optional content-work/reviews/author-NN.md. Do not modify source/runtime/tests or other batches. Read assigned input file in full (100 entries, paginate). Root C:/Users/PC/Oxford-Focus. Load educational-app-prototyping skill.

Create a JSON ARRAY with exactly one authored record per input ID, preserving exact id and headword. Required fields:
- sourceId: input id
- headword: exact input headword
- displayWord and speechText: normal spoken/headword form, using explicitly provided lookupLemma for annotated homographs (e.g. light (from...) -> light). Preserve capitalized I, months, weekdays, TV, CD, DVD, T-shirt. For a, an teach a as primary and contentNote explaining an before a vowel SOUND with its own short example.
- translation: concise, modern Turkish for ONE relevant A1 sense and POS. Prefer one unambiguous meaning; not a dump of synonyms. Consult dictionaryCandidates with their POS and gloss, NOT the first result blindly. For like/second/bank separate source IDs select the correct sense. No higher-level POS when the source only assigns it above A1. Evidence may be wrong: correct obvious mismatch and document it.
- example: original, natural, simple English sentence using the exact displayWord as a word/phrase (case-insensitive). Not an inflection alone; not dictionary quotations; no repetitive 'This is X' template for everything; usually 4–10 words. Match taught sense/POS. Proper punctuation.
- exampleTr: faithful natural Turkish translation of that sentence.
- ipaUS: choose ONE matching POS/base-form pronunciation from ipaCandidates en-US, copying a real candidate. Variants are slash-delimited. Do not select past tense read or wrong POS noun/verb stress. If absent, fetch an actual primary dictionary page, save its relevant evidence in review note, and document URL; no invented source claims.
- ipaUK: choose matching candidate from en-GB when available. If absent, use existing verified-by-input pilot pronunciation only if existing field provided, or leave empty string. UK is optional in this expansion; do not manufacture UK from US.
- approxUS, approxUK: individually authored Turkish reading aids matched to selected IPA, hyphenated where useful. User approved always exactly 'ool-veyz'. For missing UK use empty approxUK. These are approximations, never phonetic authority. Avoid automatic character-map generation as final content; inspect every word.
- topicTags: 1–3 meaningful tags from daily-life, people, family, food, home, travel, school, work, time, numbers, nature, body, clothes, feelings, actions, descriptions, communication, function-words, technology, culture, sport, places, money.
- selectedSense: brief English gloss identifying intended sense/POS.
- translationEvidence: dictionaryCandidates entry string (exact lexentry) for chosen meaning; if no suitable candidate, real dictionary URL actually retrieved + explanation in contentNote.
- ipaEvidenceUS: 'ipa-dict/en_US:<lookupLemma>' if matching provided candidate, otherwise actual fetched source URL.
- ipaEvidenceUK: 'ipa-dict/en_UK:<lookupLemma>' if matching candidate, 'legacy-pilot' for existing entry reused, 'unavailable' if empty.
- contentNote: optional limitations/word-specific learning help. Never mark content as human-reviewed.

All content will be labelled draft + automated/AI-assisted checks, not editorially reviewed. Parent merges and independently validates. Existing 48 cards may retain their original examples/meanings if correct, but must fit exact display word and one intended A1 sense. Do not blindly copy existing bad enrichment.

References: input dictionaryCandidates are real downloaded WikDict English-Turkish SQLite (Wiktionary/DBnary), content-work/references/en-tr.sqlite3. Translation lexentry includes POS. IPA comes from open-dict-data/ipa-dict en_US.txt (CMU-based, MIT) and en_UK.txt (ipacards, GPL3). Source snapshots already downloaded; parent manages attribution. You may query SQLite and txt files with Python for additional evidence. Missing lookup candidates: cafe (look up café); could (past modal of can); next to (adjacent/beside). Input aliases are evidence lookup only: never mutate original source IDs/headwords.

Use tools to write actual content in manageable batches (e.g. 20 records at a time) and merge into final assigned JSON. Count/dedupe with Python; all 100 IDs must match. Before finishing, reread/review EVERY authored record for meaning/example consistency, exact target occurrence, US IPA variant/POS, Turkish sentence and approximation. Correct discovered mistakes. Save review notes with actual checks and unresolved problems. Report path, actual count, unresolved items, NOT all-human-verified claims.

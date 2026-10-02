# A1 content and speech notes

## Content scope and review status

`node scripts/validate-content.js` calculates coverage from the current source file. Current measured scope: **3,000 source records; A1 900, A2 800, B1 700, B2 600; 3,000 eligible draft lesson cards; zero human/editorially reviewed cards; 19 legacy IPA-symbol rows**. All four levels have a complete card for every source ID. Coverage is complete, but independent linguistic/editorial review is not.

The initial 48-card pilot was preserved in `data/enrichment.pre-a1.json` and in the pre-expansion ZIP backup. The active `data/enrichment.json` now maps all 3,000 source IDs across A1, A2, B1 and B2. Each entry retains its exact source ID, selected sense/POS evidence, pronunciation evidence, original authored example, Turkish translation, topic tags and `reviewStatus: 'draft'`. The source headword `a, an` remains unchanged while its learning card teaches **a** through `displayWord: 'a'` and `speechText: 'a'`; a visible note explains **an** before a vowel sound. Source word/ID/raw/sense/page metadata remain unchanged by `joinContent`.

Every A1 entry has an individually selected en-US IPA and individually authored Turkish approximate-reading draft. 825 entries additionally have evidence-backed en-GB IPA and a matched reading aid; missing UK data is omitted rather than copied from en-US. The A2/B1/B2 cards follow the same rule: every card has an evidence-backed en-US IPA, and en-GB is present only where the snapshot supplied a candidate (A2 761/800, B1 543/700, B2 558/600) — US values are never relabelled as UK. Where the offline snapshot's dictionary candidates could not support the taught sense, a real public dictionary page (Cambridge English–Turkish) was retrieved, recorded in `content-work/evidence-a2b1b2.json` and cited as `translationEvidence`; no translation was invented. Meanings were sense/POS-selected against recorded WikDict or entry-specific dictionary evidence. English examples, Turkish example translations and reading aids are AI-assisted original drafts. They are **not independent human editorial approval, speaker recordings or pronunciation scoring**. Per-entry `provenance` separates reference-derived fields from authored additions; third-party attribution and licenses are in `THIRD-PARTY-NOTICES.md`.

`eligible` means structurally complete enough for lessons; it does **not** mean human-reviewed or approved for public publication. The validator rejects missing/blank essential fields, absent provenance, malformed tags, bad review states and wrong content versions. Rejected, unknown and incomplete entries cannot enter the eligible pool. Ambiguous repeated headwords require an explicit `sourceId`; matching does not merge by case-folded headword. Source-level restrictions prevent reusing an A1 card for another level.

## Turkish approximate-reading disclaimer

Use the label **Türkçe yaklaşık okunuş**. These hints support recall, not pronunciation assessment. They do not replace IPA or actual audio. Hyphens aid reading and are not authoritative syllable boundaries. Turkish spelling cannot faithfully represent /æ/, /ə/, /w/, /ŋ/ or English /r/: for example, /æ/ is between Turkish e/a, /w/ is not Turkish v, and /ŋ/ is not a separate n-plus-g ending. Longer vowels and r-colouring require listening. The approved `always` hint is exactly **ool-veyz** for both accent entries. US regional vowel mergers and UK regional variation are not comprehensively represented. A linguist should review IPA, approximate readings and examples together before public release.

Top-level JSON `ipa` retains the original migration value. Consumers should use `getPronunciation(word, accent)` for accent-specific display. Joined cards expose US `ipa`/`approxTr` aliases by default; an unsupported/missing accent returns empty strings rather than silently displaying the other accent. `data/ipa.json` preserves the original 19-row partial table, including its legacy simplifications; it is not a full or reviewed IPA alphabet and is not universally accent-neutral.

## Speech contract

`createSpeechController({notify, onStatus})` provides `speak`, `cancel`, `getVoices` and `dispose`. `speak(text, {lang:'en-US', rate:0.85, enabled:true})` returns a promise resolving to `{ok, reason, voiceName, lang}`. Success means the platform delivered `end`, not a quality/accent audit or proof the user heard sound. A slow request such as `rate:0.6` is forwarded to the voice engine.

Selection is from actual `SpeechSynthesisVoice` objects with an exact locale match (case-insensitive). It never substitutes generic English, another accent, or `utterance.lang` alone. Local voices rank ahead of remote ones, then a platform-default voice wins a tie. No objective quality ranking of installed voices is claimed. An absent requested voice waits for `voiceschanged` up to 1,500ms, rechecks once on timeout, then gives visible feedback. The user may retry if the OS takes longer to initialize.

When `navigator.onLine === false`, only `localService === true` voices can be selected. A remote/unknown service is not advertised as offline-capable. Local-service metadata and navigator online status are browser hints, not guarantees; platform/network errors are still handled. The module neither installs a voice nor bundles audio. Actual voice inventory, audible output and pronunciation quality require device/browser acceptance tests.

Cancellation invalidates the active request before calling the platform, resolves pending work as `cancelled`, removes discovery listeners, and suppresses stale end/error callbacks. Dispose prevents future playback. **Callers should treat `reason: 'cancelled'` as intentional, not a missing-audio failure**; a repeated play click supersedes the earlier promise. UI navigation, switching accent, disabling sound and starting another utterance should cancel the current request.

## Official API references consulted

The search/extraction backend was partially unavailable; official MDN pages were additionally fetched directly over HTTPS and read. These are API sources only, not dictionary verification:

- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/voice
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/error_event
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/cancel
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/rate

## Verification

Run `node --test tests/content.test.js tests/speech.test.js` and `node scripts/validate-content.js`. Content tests use the current source inventory and compare every preserved source field. Speech tests use fake platform boundaries to exercise actual controller logic: exact voice/rate selection, delayed arrival, missing-accent timeout, unsupported API, disabled/invalid requests, network and thrown errors, offline local preference, cancellation while waiting, supersession, stale events and disposal. These tests do not claim audible browser playback was heard.

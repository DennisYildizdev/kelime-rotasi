"""Apply evidence-backed repairs to the 27 blocked A2 cards.

This script is deliberately explicit and idempotent. It only updates named source
IDs, never guesses from a word string, and keeps every repaired value tied to a
local dictionary entry or a pinned public dictionary URL.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BATCH_DIR = ROOT / "content-work" / "batches"
EVIDENCE_PATH = ROOT / "content-work" / "evidence-a2b1b2.json"

IPA_REPAIRS = {
    "according-to-65": ("/əˈkɔɹdɪŋ/", "ı-kor-ding", None, None),
    "all-right-90": ("/ˌɔːlˈɹaɪt/", "ool-rayt", "/ˌɔːlˈɹaɪt/", "ool-rayt"),
    "any-more-242": ("/ˌɛ.niˈmɔː/", "e-ni-mor", None, None),
    "jewellery-1592": ("/ˈd͡ʒuː(ə)lɹi/", "cuu-ıl-ri", None, None),
    "maths-1495": ("/mæθs/", "mets", None, None),
    "per-cent-1838": ("/pɝˈsɛnt/", "pır-sent", None, None),
    "used-to-2820": ("/jus(t).tu/", "yus-tu", "/juːs(t).tu/", "yuus-tu"),
    # The original row selected the verb sense but carried the metal noun IPA.
    "lead1-1569": ("/liːd/", "liid", None, None),
}

TRANSLATION_URLS = {
    "identify-1127": "https://dictionary.cambridge.org/dictionary/english/identify",
    "lab-1464": "https://dictionary.cambridge.org/dictionary/english-turkish/lab",
    "lead1-1569": "https://dictionary.cambridge.org/dictionary/english-turkish/lead",
    "lorry-1574": "https://dictionary.cambridge.org/dictionary/english-turkish/lorry",
    "per-cent-1838": "https://dictionary.cambridge.org/dictionary/english-turkish/per-cent",
    "worse-2874": "https://dictionary.cambridge.org/dictionary/english-turkish/worse",
    "act-101": "https://dictionary.cambridge.org/dictionary/english-turkish/act",
    "behaviour-273": "https://dictionary.cambridge.org/dictionary/english-turkish/behaviour",
    "brilliant-310": "https://www.oxfordlearnersdictionaries.com/definition/english/brilliant",
    "disagree-588": "https://dictionary.cambridge.org/dictionary/english-turkish/disagree",
    "driving-810": "https://dictionary.cambridge.org/dictionary/english-turkish/driving",
    "drop-811": "https://dictionary.cambridge.org/dictionary/english-turkish/drop",
    "either-968": "https://dictionary.cambridge.org/dictionary/english-turkish/either",
    "electrical-988": "https://dictionary.cambridge.org/dictionary/english-turkish/electrical",
    "farming-1018": "https://dictionary.cambridge.org/dictionary/english-turkish/farming",
    "petrol-1907": "https://dictionary.cambridge.org/dictionary/english/petrol",
    "replace-2184": "https://dictionary.cambridge.org/dictionary/english/replace",
    "rest-remaining-part--2281": "https://dictionary.cambridge.org/dictionary/english/rest",
}

LOCAL_ENTRY_REPAIRS = {
    "flying-1019": ("eng/fly__Noun__2", "act of flying", "uçuş"),
    "tablet-2493": (
        "eng/tablet_computer__Noun__1",
        "hand-held portable computer in the form of a tablet",
        "tablet bilgisayarı",
    ),
}

TRANSLATION_VALUES = {
    "lab-1464": "laboratuvar",
    "lorry-1574": "kamyon",
    "per-cent-1838": "yüzde",
}


def load_rows():
    files = sorted(BATCH_DIR.glob("a2-*.json"))
    batches = {path: json.loads(path.read_text(encoding="utf-8-sig")) for path in files}
    rows = {row["sourceId"]: row for batch in batches.values() for row in batch}
    return batches, rows


def main():
    batches, rows = load_rows()
    evidence = json.loads(EVIDENCE_PATH.read_text(encoding="utf-8"))
    proofs = {item.get("id") or item.get("sourceId"): item for item in evidence}

    for source_id, translation in TRANSLATION_VALUES.items():
        rows[source_id]["translation"] = translation

    for source_id, (us_ipa, us_approx, uk_ipa, uk_approx) in IPA_REPAIRS.items():
        row = rows[source_id]
        proof = proofs[source_id]
        external = proof.setdefault("externalEvidence", {})
        external_ipa = external.setdefault("ipa", {})
        us_url = (
            (external_ipa.get("en-US") or {}).get("sourceUrl")
            or TRANSLATION_URLS.get(source_id)
            or "https://dictionary.cambridge.org/dictionary/english-turkish/lead"
        )
        external_ipa["en-US"] = {"ipa": us_ipa, "sourceUrl": us_url}
        row.update(ipaUS=us_ipa, approxUS=us_approx, ipaEvidenceUS="external-dictionary")
        if uk_ipa:
            uk_url = (external_ipa.get("en-GB") or {}).get("sourceUrl") or us_url
            external_ipa["en-GB"] = {"ipa": uk_ipa, "sourceUrl": uk_url}
            row.update(ipaUK=uk_ipa, approxUK=uk_approx, ipaEvidenceUK="external-dictionary")
        elif not row.get("ipaUK"):
            row.update(ipaUK="", approxUK="", ipaEvidenceUK="unavailable")

    for source_id, url in TRANSLATION_URLS.items():
        row = rows[source_id]
        proof = proofs[source_id]
        external = proof.setdefault("externalEvidence", {})
        external["translations"] = {"translations": [row["translation"]], "sourceUrl": url}
        row["translationEvidence"] = url

    for source_id, (entry, sense, translation) in LOCAL_ENTRY_REPAIRS.items():
        row = rows[source_id]
        proof = proofs[source_id]
        candidates = proof.setdefault("dictionaryCandidates", [])
        if not any(candidate.get("entry") == entry for candidate in candidates):
            candidates.append({"entry": entry, "sense": sense, "translations": translation})
        row["translationEvidence"] = entry

    # Remove stale notes that claim repaired evidence is still missing.
    for source_id in set(IPA_REPAIRS) | set(TRANSLATION_URLS) | set(LOCAL_ENTRY_REPAIRS):
        row = rows[source_id]
        row["contentNote"] = (
            "Kaynak anlam ve telaffuz kanıtı doğrulama kaydına sabitlendi. "
            "Türkçe yaklaşık okunuş yardımcıdır; IPA ve sesin yerine geçmez."
        )

    for path, batch in batches.items():
        path.write_text(json.dumps(batch, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    EVIDENCE_PATH.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"repairedRows": len(set(IPA_REPAIRS) | set(TRANSLATION_URLS) | set(LOCAL_ENTRY_REPAIRS)),
                      "batchFiles": len(batches)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

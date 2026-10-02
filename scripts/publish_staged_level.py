"""Atomically publish a fully validated staged level without altering A1."""
from __future__ import annotations

import argparse
import json
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--staged", default="content-work/enrichment.staged-ab.json")
    parser.add_argument("--level", required=True)
    parser.add_argument("--expected", required=True, type=int)
    parser.add_argument("--backup", required=True)
    args = parser.parse_args()

    active_path = ROOT / "data/enrichment.json"
    staged_path = ROOT / args.staged
    backup_path = ROOT / args.backup
    active = json.loads(active_path.read_text(encoding="utf-8"))
    staged = json.loads(staged_path.read_text(encoding="utf-8"))

    active_a1 = {key: value for key, value in active.items() if value.get("sourceLevel") == "A1"}
    if len(active_a1) != 900:
        raise SystemExit(f"Refusing publish: active A1 count is {len(active_a1)}, expected 900")
    if len(staged) != args.expected:
        raise SystemExit(f"Refusing publish: staged count is {len(staged)}, expected {args.expected}")
    wrong = [key for key, card in staged.items() if card.get("sourceLevel") != args.level]
    if wrong:
        raise SystemExit(f"Refusing publish: {len(wrong)} staged cards are not {args.level}")
    conflicts = [key for key in staged if key in active and active[key] != staged[key]]
    if conflicts:
        raise SystemExit(f"Refusing publish: conflicting active keys: {', '.join(conflicts[:10])}")

    backup_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(active_path, backup_path)
    merged = dict(active)
    merged.update(staged)
    if {key: value for key, value in merged.items() if value.get("sourceLevel") == "A1"} != active_a1:
        raise SystemExit("Refusing publish: A1 changed during merge")

    temporary = active_path.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, active_path)
    print(json.dumps({"published": args.level, "cards": len(staged), "activeCards": len(merged),
                      "a1Unchanged": True, "backup": str(backup_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

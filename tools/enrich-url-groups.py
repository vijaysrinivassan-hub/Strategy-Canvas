"""Enrich the shared URL repository with the grouping encoded in the source workbook.

Each URL is its own topic unless the workbook cell contains long-dash separators.
In a separated cell, every separator-delimited chunk is one topic. A topic that
contains a Maximus Labs URL is marked covered so the keyword matrix can show it red.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

import openpyxl


SEPARATOR = re.compile(r"^\s*[―—–-]{5,}\s*$")


def topic_from_url(url: str) -> str:
    parsed = urlparse(url)
    part = unquote(parsed.path.rstrip("/").split("/")[-1]) or parsed.netloc
    words = re.sub(r"[_-]+", " ", part).strip()
    return words[:1].upper() + words[1:] if words else "URL topic"


def groups_from_cell(value: object) -> list[list[str]]:
    lines = [line.strip() for line in str(value or "").splitlines() if line.strip()]
    groups: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        if SEPARATOR.fullmatch(line):
            if current:
                groups.append(current)
                current = []
            continue
        if line.startswith(("https://", "http://")):
            current.append(line)
    # Separator lines explicitly terminate a same-topic group. URLs after the
    # final separator (or in a cell with no separators) remain individual.
    groups.extend([[url] for url in current])
    return groups


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: enrich-url-groups.py SOURCE.xlsx competitive-intelligence-classifications.json")
    workbook_path, asset_path = map(Path, sys.argv[1:])
    asset = json.loads(asset_path.read_text(encoding="utf-8"))
    classifications = asset["classifications"]
    workbook = openpyxl.load_workbook(workbook_path, rich_text=True, data_only=False)
    touched: set[str] = set()
    groups = 0
    covered_groups = 0
    for sheet in workbook.worksheets:
        if sheet.title.startswith("Corporate & Non-SEO"):
            continue
        for row in sheet.iter_rows():
            for cell in row:
                parsed_groups = groups_from_cell(cell.value)
                if not parsed_groups:
                    continue
                for group_order, urls in enumerate(parsed_groups):
                    key = f"{sheet.title}|{cell.coordinate}|{group_order}"
                    group_id = "workbook-group-" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]
                    covered = any("maximuslabs.ai" in urlparse(url).netloc.lower() for url in urls)
                    topic = topic_from_url(urls[0])
                    groups += 1
                    covered_groups += int(covered)
                    for url in urls:
                        meta = classifications.get(url)
                        if not meta:
                            continue
                        meta.update({
                            "topicGroup": group_id,
                            "topic": topic,
                            "groupOrder": group_order,
                            "groupSize": len(urls),
                            "covered": covered,
                            "sourceSheet": sheet.title,
                            "sourceCell": cell.coordinate,
                        })
                        touched.add(url)
    missing = [url for url, meta in classifications.items() if meta.get("section") != "Corporate & Non-SEO" and url not in touched]
    if missing:
        raise SystemExit(f"{len(missing)} SEO/AEO URLs were not found in the workbook; first: {missing[0]}")
    asset["version"] = 3
    asset["classifiedAt"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    asset["grouping"] = {
        "rule": "one URL per topic unless explicitly grouped between workbook separator lines",
        "topicGroups": groups,
        "coveredGroups": covered_groups,
        "coveredBy": "Maximus Labs",
    }
    asset_path.write_text(json.dumps(asset, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"urls": len(touched), "topicGroups": groups, "coveredGroups": covered_groups}))


if __name__ == "__main__":
    main()

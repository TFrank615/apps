"""Build the static page-level search index for the protocol app."""

import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent
PDF_PATH = ROOT / "2025protocol.pdf"
INDEX_PATH = ROOT / "search-index.json"
HEADER_PATTERN = re.compile(
    r"^(?P<series_name>.+?)\s+(?P<series_number>[A-Z]|\d{4})\s+"
    r"Subject:\s*(?P<subject>.+?)\s+Effective:",
    re.IGNORECASE,
)


def page_metadata(text: str, previous: dict[str, str] | None) -> dict[str, str]:
    header = HEADER_PATTERN.search(text)
    if header:
        return {
            "seriesNumber": header.group("series_number"),
            "seriesName": header.group("series_name").strip(),
            "subject": header.group("subject").strip(),
        }

    if text.startswith("Last Update"):
        return {
            "seriesNumber": "2025",
            "seriesName": "Standing Orders",
            "subject": "Cover",
        }

    if text.startswith("Acknowledgement"):
        return {
            "seriesNumber": "Front Matter",
            "seriesName": "Standing Orders",
            "subject": "Acknowledgement",
        }

    if text.startswith("Table of Contents"):
        return {
            "seriesNumber": "Front Matter",
            "seriesName": "Standing Orders",
            "subject": "Table of Contents",
        }

    if previous:
        return previous.copy()

    return {
        "seriesNumber": "Front Matter",
        "seriesName": "Standing Orders",
        "subject": "Protocol Information",
    }


def build_index() -> None:
    reader = PdfReader(PDF_PATH)
    pages = []
    previous_metadata = None

    for page_number, page in enumerate(reader.pages, start=1):
        raw_text = page.extract_text() or ""
        display_text = re.sub(r"[ \t]+", " ", raw_text)
        display_text = re.sub(r"\s*\n\s*", " ", display_text).strip()
        if not display_text:
            continue

        metadata = page_metadata(display_text, previous_metadata)
        previous_metadata = metadata

        pages.append(
            {
                "page": page_number,
                **metadata,
                "text": display_text,
            }
        )

    payload = {
        "pdf": PDF_PATH.name,
        "pageCount": len(reader.pages),
        "searchablePageCount": len(pages),
        "pages": pages,
    }
    INDEX_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    print(
        f"Indexed {len(pages)} searchable pages out of {len(reader.pages)} "
        f"into {INDEX_PATH.name}."
    )


if __name__ == "__main__":
    build_index()

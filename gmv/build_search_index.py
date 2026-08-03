"""Build the static page-level search index for the protocol app."""

import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent
PDF_PATH = ROOT / "2025protocol.pdf"
INDEX_PATH = ROOT / "search-index.json"


def build_index() -> None:
    reader = PdfReader(PDF_PATH)
    pages = []

    for page_number, page in enumerate(reader.pages, start=1):
        raw_text = page.extract_text() or ""
        display_text = re.sub(r"[ \t]+", " ", raw_text)
        display_text = re.sub(r"\s*\n\s*", " ", display_text).strip()
        if not display_text:
            continue

        pages.append(
            {
                "page": page_number,
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

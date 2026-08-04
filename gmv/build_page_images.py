"""Render the fixed protocol PDF into iPad-friendly WebP page images."""

from pathlib import Path

import pypdfium2 as pdfium


ROOT = Path(__file__).resolve().parent
PDF_PATH = ROOT / "2025protocol.pdf"
PAGES_DIR = ROOT / "pages"
RENDER_SCALE = 2.0  # 144 DPI for standard 72-point PDF pages.
WEBP_QUALITY = 76


def build_pages() -> None:
    document = pdfium.PdfDocument(PDF_PATH)
    PAGES_DIR.mkdir(exist_ok=True)

    for page_index in range(len(document)):
        output_path = PAGES_DIR / f"page-{page_index + 1:03d}.webp"
        page = document[page_index]
        bitmap = page.render(scale=RENDER_SCALE)
        image = bitmap.to_pil().convert("RGB")
        image.save(output_path, "WEBP", quality=WEBP_QUALITY, method=6)
        page.close()

        if page_index == 0 or (page_index + 1) % 25 == 0 or page_index + 1 == len(document):
            print(f"Rendered page {page_index + 1} of {len(document)}", flush=True)

    document.close()


if __name__ == "__main__":
    build_pages()

# Project handover

## Purpose

Generate print-ready lamp-offering labels from exact lamp numbers and display names without uploading donor-level data.

## Architecture

- `index.html`: accessible input, validation report, preview and download controls.
- `script.js`: safe DOM rendering, automatic label fitting and sequential browser-side PDF creation.
- `lib/label-logic.mjs`: pure parsing, deceased classification, validation and line-layout logic.
- `tests/`: Node tests for the highest-risk parsing and classification rules.
- `Lamp.jpg` and `Deceased.jpg`: living and deceased page backgrounds.

## Operational rules

- Preserve source spelling while normalizing only established company suffixes (`Pte Ltd`, `Sdn Bhd`) and parenthetical abbreviations such as `(SM)`. Keep other company acronyms unchanged.
- Apply semantic grouping before font reduction: leading English preferred names above the remaining full name, compound English given names together, long South Asian first names above the remainder, and separate lines for `& Family`, parenthetical names and comma-separated alternate names. Keep short names and readable company names on one line. Never shrink below the verified M0797 reference size (38 px).
- Keep a 20 px horizontal and 12 px vertical safe inset inside every printed label, and use the same inset in overflow validation so names cannot pass validation while visually touching the box border.
- `故`, `已故`, `仙逝`, `往生`, explicit deceased descriptions, ancestors and sentient-being descriptions use the deceased layout.
- Duplicate or malformed lamp numbers block PDF download.
- A label that cannot fit inside its grid cell blocks PDF download and is outlined in red.
- PDF generation is browser-local and restores the preview after success or failure.

## Verification

Run `npm test`, serve locally, and test a valid list plus invalid, duplicate, deceased, long-name and CSV-with-comma cases. Confirm desktop and mobile input layouts, no relevant console errors, and no red overflow labels before downloading.

On 27 October 2026, the full verified workbook list rendered 912 labels across 15 A3 pages with no validation or overflow errors. M0009 stayed on one line, all audited English-name examples remained at or above 38 px, M0123 and M0591 retained visible space from every border, and M0363–M0383 rendered on yellow deceased pages.

## Hosting

The public GitHub Pages site is sourced from `swc927/lamp-offering-list`. Development changes belong on a feature branch. Do not advance `main` or publish without an explicitly authorized release after review.

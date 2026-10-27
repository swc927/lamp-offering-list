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

- Preserve the exact display-name capitalization supplied by the verified source. Do not recase companies or acronyms.
- `故`, `已故`, `仙逝`, `往生`, ancestors and sentient-being descriptions use the deceased layout.
- Duplicate or malformed lamp numbers block PDF download.
- A label that cannot fit inside its grid cell blocks PDF download and is outlined in red.
- PDF generation is browser-local and restores the preview after success or failure.

## Verification

Run `npm test`, serve locally, and test a valid list plus invalid, duplicate, deceased, long-name and CSV-with-comma cases. Confirm desktop and mobile input layouts, no relevant console errors, and no red overflow labels before downloading.

## Hosting

The public GitHub Pages site is sourced from `swc927/lamp-offering-list`. Development changes belong on a feature branch. Do not advance `main` or publish without an explicitly authorized release after review.

# Lamp Offering List Generator

Browser-local generator for lamp-offering name labels. Paste or import one `M0001`-style lamp number and display name per row, validate the complete list, review living and deceased pages, then download the verified PDF. Valid suffixed references such as `M0683A` are accepted. Repeated identical number/name rows create multiple physical labels, while conflicting names for the same offering number are rejected.

Names use semantic line grouping before font reduction: a leading English preferred name stays above the remaining full name, compound English given names stay together, family wording and parenthetical names move to their own line, and long South Asian names keep the first meaningful supplied name above the remainder. Short names and company names remain on one line whenever readable. Company suffixes render consistently as `Pte Ltd` and `Sdn Bhd`, and parenthetical abbreviations such as `(SM)` remain uppercase. Deceased wording, including an explicit `Deceased` description, is placed on the yellow deceased layout.
Every label also reserves a 20 px horizontal and 12 px vertical safe inset so long names do not visually touch the printed box border.

The app does not upload the pasted list. It uses locally rendered HTML and client-side PDF generation. Serve the repository as static files; for local testing run `python3 -m http.server 4173` and open `http://127.0.0.1:4173/`.

Run the logic tests with `npm test`.
